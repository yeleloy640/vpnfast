import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { MongoServerError } from "mongodb";
import { getCollection } from "@/lib/mongodb";

const scrypt = promisify(scryptCallback);
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const isoNow = () => new Date().toISOString();

export type PublicUser = { id: string; name: string; email: string };
export type DashboardData = {
  user: PublicUser;
  subscription: { plan: string; status: string; expiresAt: string | null };
  devices: { id: string; name: string; platform: string; createdAt: string }[];
  payments: { orderId: string; amount: string; status: string; createdAt: string }[];
};

type UserDocument = PublicUser & { passwordHash: string; deviceCount?: number };
type SubscriptionDocument = { userId: string; plan: string; status: string; expiresAt: string | null };
type DeviceDocument = { id: string; userId: string; name: string; platform: string; createdAt: string };
type PaymentDocument = { orderId: string; userId: string; planMonths: number; amount: string; status: string; heleketUuid?: string; invoiceUrl?: string; createdAt: string; updatedAt: string };

export async function createAccount(name: string, email: string, password: string): Promise<PublicUser> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  const user = { id: randomBytes(16).toString("hex"), name, email };
  try {
    await (await getCollection<UserDocument>("users")).insertOne({ ...user, passwordHash: `${salt}:${derived.toString("hex")}`, deviceCount: 0 });
    await (await getCollection<SubscriptionDocument>("subscriptions")).insertOne({ userId: user.id, plan: "free", status: "inactive", expiresAt: null });
    return user;
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) throw new Error("An account with this email already exists.");
    throw error;
  }
}

export async function authenticate(email: string, password: string): Promise<PublicUser | null> {
  const row = await (await getCollection<UserDocument>("users")).findOne({ email });
  if (!row) return null;
  const [salt, stored] = row.passwordHash.split(":");
  const derived = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(stored, "hex");
  if (derived.length !== expected.length || !timingSafeEqual(derived, expected)) return null;
  return { id: row.id, name: row.name, email: row.email };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await (await getCollection("sessions")).insertOne({ tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) });
  return token;
}

export async function getUserForSession(token: string): Promise<PublicUser | null> {
  const session = await (await getCollection<{ tokenHash: string; userId: string }>("sessions")).findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await (await getCollection<UserDocument>("users")).findOne({ id: session.userId });
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

export async function deleteSession(token: string) {
  await (await getCollection("sessions")).deleteOne({ tokenHash: hashToken(token) });
}

export async function getDashboard(user: PublicUser): Promise<DashboardData> {
  const [subscription, devices, payments] = await Promise.all([
    (await getCollection<SubscriptionDocument>("subscriptions")).findOne({ userId: user.id }),
    (await getCollection<DeviceDocument>("devices")).find({ userId: user.id }).sort({ createdAt: -1 }).toArray(),
    (await getCollection<PaymentDocument>("payments")).find({ userId: user.id }).sort({ createdAt: -1 }).limit(10).toArray(),
  ]);
  return {
    user,
    subscription: subscription ? { plan: subscription.plan, status: subscription.status, expiresAt: subscription.expiresAt } : { plan: "free", status: "inactive", expiresAt: null },
    devices: devices.map(({ id, name, platform, createdAt }) => ({ id, name, platform, createdAt })),
    payments: payments.map(({ orderId, amount, status, createdAt }) => ({ orderId, amount, status, createdAt })),
  };
}

export async function addDevice(userId: string, name: string, platform: string) {
  const users = await getCollection<UserDocument>("users");
  const reserved = await users.updateOne({ id: userId, deviceCount: { $lt: 5 } }, { $inc: { deviceCount: 1 } });
  if (!reserved.matchedCount) throw new Error("device_limit_reached");
  const id = randomBytes(16).toString("hex");
  try {
    await (await getCollection<DeviceDocument>("devices")).insertOne({ id, userId, name, platform, createdAt: isoNow() });
    return id;
  } catch (error) {
    await users.updateOne({ id: userId }, { $inc: { deviceCount: -1 } });
    throw error;
  }
}

export async function removeDevice(userId: string, id: string) {
  const result = await (await getCollection<DeviceDocument>("devices")).deleteOne({ userId, id });
  if (result.deletedCount) await (await getCollection<UserDocument>("users")).updateOne({ id: userId, deviceCount: { $gt: 0 } }, { $inc: { deviceCount: -1 } });
  return result.deletedCount > 0;
}

export async function createPaymentOrder(orderId: string, userId: string, planMonths: number, amount: string) {
  const now = isoNow();
  await (await getCollection<PaymentDocument>("payments")).insertOne({ orderId, userId, planMonths, amount, status: "pending", createdAt: now, updatedAt: now });
}

export async function markPaymentCreated(orderId: string, uuid: string, invoiceUrl: string) {
  await (await getCollection<PaymentDocument>("payments")).updateOne({ orderId }, { $set: { heleketUuid: uuid, invoiceUrl, updatedAt: isoNow() } });
}

export async function failPaymentOrder(orderId: string) {
  await (await getCollection<PaymentDocument>("payments")).updateOne({ orderId, status: "pending" }, { $set: { status: "failed", updatedAt: isoNow() } });
}

export async function applyPayment(orderId: string, status: string) {
  const validStatuses = new Set(["confirm_check", "paid", "paid_over", "fail", "wrong_amount", "cancel", "system_fail", "refund_process", "refund_fail", "refund_paid"]);
  if (!validStatuses.has(status)) return false;
  const payments = await getCollection<PaymentDocument>("payments");
  const normalized = status === "paid_over" ? "paid" : status;
  const changed = await payments.findOneAndUpdate({ orderId, status: { $ne: "paid" } }, { $set: { status: normalized, updatedAt: isoNow() } }, { returnDocument: "after" });
  if (!changed) return (await payments.countDocuments({ orderId })) > 0;
  if (normalized === "paid") {
    const now = new Date();
    await (await getCollection<SubscriptionDocument>("subscriptions")).updateOne(
      { userId: changed.userId },
      [{ $set: { userId: changed.userId, plan: "premium", status: "active", expiresAt: { $dateToString: { date: { $dateAdd: { startDate: { $cond: [{ $gt: [{ $toDate: { $ifNull: ["$expiresAt", now] } }, now] }, { $toDate: "$expiresAt" }, now] }, unit: "month", amount: changed.planMonths } }, format: "%Y-%m-%dT%H:%M:%S.%LZ" } } } }],
      { upsert: true },
    );
  }
  return true;
}
