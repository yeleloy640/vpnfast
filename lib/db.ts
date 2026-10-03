import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const scrypt = promisify(scryptCallback);
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type PublicUser = { id: string; name: string; email: string };
export type DashboardData = {
  user: PublicUser;
  subscription: { plan: string; status: string; expiresAt: string | null };
  devices: { id: string; name: string; platform: string; createdAt: string }[];
  payments: { orderId: string; amount: string; status: string; createdAt: string }[];
};

type UserRow = PublicUser & { password_hash: string };
type SubscriptionRow = DashboardData["subscription"];
type DeviceRow = DashboardData["devices"][number];
type PaymentRow = DashboardData["payments"][number];

function database() {
  return getCloudflareContext().env.DB;
}

export async function createAccount(name: string, email: string, password: string): Promise<PublicUser> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  const user = { id: randomBytes(16).toString("hex"), name, email };
  try {
    await database().batch([
      database().prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").bind(user.id, name, email, `${salt}:${derived.toString("hex")}`),
      database().prepare("INSERT INTO subscriptions (user_id) VALUES (?)").bind(user.id),
    ]);
    return user;
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed: users.email")) throw new Error("An account with this email already exists.");
    throw error;
  }
}

export async function authenticate(email: string, password: string): Promise<PublicUser | null> {
  const row = await database().prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?").bind(email).first<UserRow>();
  if (!row) return null;
  const [salt, stored] = row.password_hash.split(":");
  const derived = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(stored, "hex");
  if (derived.length !== expected.length || !timingSafeEqual(derived, expected)) return null;
  return { id: row.id, name: row.name, email: row.email };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await database().prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").bind(hashToken(token), userId, Date.now() + 1000 * 60 * 60 * 24 * 30).run();
  return token;
}

export async function getUserForSession(token: string): Promise<PublicUser | null> {
  return await database().prepare(`SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`).bind(hashToken(token), Date.now()).first<PublicUser>();
}

export async function deleteSession(token: string) {
  await database().prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hashToken(token)).run();
}

export async function getDashboard(user: PublicUser): Promise<DashboardData> {
  const db = database();
  const [subscription, devices, payments] = await Promise.all([
    db.prepare("SELECT plan, status, expires_at AS expiresAt FROM subscriptions WHERE user_id = ?").bind(user.id).first<SubscriptionRow>(),
    db.prepare("SELECT id, name, platform, created_at AS createdAt FROM devices WHERE user_id = ? ORDER BY created_at DESC").bind(user.id).all<DeviceRow>(),
    db.prepare("SELECT order_id AS orderId, amount, status, created_at AS createdAt FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10").bind(user.id).all<PaymentRow>(),
  ]);
  return {
    user,
    subscription: subscription ?? { plan: "free", status: "inactive", expiresAt: null },
    devices: devices.results,
    payments: payments.results,
  };
}

export async function addDevice(userId: string, name: string, platform: string) {
  const id = randomBytes(16).toString("hex");
  await database().prepare("INSERT INTO devices (id, user_id, name, platform) VALUES (?, ?, ?, ?)").bind(id, userId, name, platform).run();
  return id;
}

export async function removeDevice(userId: string, id: string) {
  const result = await database().prepare("DELETE FROM devices WHERE user_id = ? AND id = ?").bind(userId, id).run();
  return result.meta.changes > 0;
}

export async function createPaymentOrder(orderId: string, userId: string, planMonths: number, amount: string) {
  await database().prepare("INSERT INTO payments (order_id, user_id, plan_months, amount) VALUES (?, ?, ?, ?)").bind(orderId, userId, planMonths, amount).run();
}

export async function markPaymentCreated(orderId: string, uuid: string, invoiceUrl: string) {
  await database().prepare("UPDATE payments SET heleket_uuid = ?, invoice_url = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE order_id = ?").bind(uuid, invoiceUrl, orderId).run();
}

export async function failPaymentOrder(orderId: string) {
  await database().prepare("UPDATE payments SET status = 'failed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE order_id = ? AND status = 'pending'").bind(orderId).run();
}

export async function applyPayment(orderId: string, status: string) {
  const db = database();
  const order = await db.prepare("SELECT order_id FROM payments WHERE order_id = ?").bind(orderId).first<{ order_id: string }>();
  if (!order) return false;
  const validStatuses = new Set(["confirm_check", "paid", "paid_over", "fail", "wrong_amount", "cancel", "system_fail", "refund_process", "refund_fail", "refund_paid"]);
  if (!validStatuses.has(status)) return false;
  const normalized = status === "paid_over" ? "paid" : status;
  await db.prepare("UPDATE payments SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE order_id = ? AND status != 'paid'").bind(normalized, orderId).run();
  return true;
}
