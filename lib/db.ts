import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

import { DatabaseSync } from "node:sqlite";



const directory = process.env.SQLITE_DATA_DIR || join(process.cwd(), "data");
mkdirSync(directory, { recursive: true });
const db = new DatabaseSync(join(directory, "fastvpn.sqlite"));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS subscriptions (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free', status TEXT NOT NULL DEFAULT 'inactive',
    expires_at TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, platform TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS payments (
    order_id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_months INTEGER NOT NULL, amount TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
    heleket_uuid TEXT, invoice_url TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const scrypt = promisify(scryptCallback);
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type PublicUser = { id: string; name: string; email: string };
export type DashboardData = {
  user: PublicUser;
  subscription: { plan: string; status: string; expiresAt: string | null };
  devices: { id: string; name: string; platform: string; createdAt: string }[];
  payments: { orderId: string; amount: string; status: string; createdAt: string }[];
};

export async function createAccount(name: string, email: string, password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  const id = randomBytes(16).toString("hex");
  try {
    db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(id, name, email, `${salt}:${derived.toString("hex")}`);
    db.prepare("INSERT INTO subscriptions (user_id) VALUES (?)").run(id);
    return { id, name, email } satisfies PublicUser;
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed: users.email")) throw new Error("An account with this email already exists.");
    throw error;
  }
}

export async function authenticate(email: string, password: string): Promise<PublicUser | null> {
  const row = db.prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?").get(email) as (PublicUser & { password_hash: string }) | undefined;
  if (!row) return null;
  const [salt, stored] = row.password_hash.split(":");
  const derived = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(stored, "hex");
  if (derived.length !== expected.length || !timingSafeEqual(derived, expected)) return null;
  return { id: row.id, name: row.name, email: row.email };
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(hashToken(token), userId, Date.now() + 1000 * 60 * 60 * 24 * 30);
  return token;
}

export function getUserForSession(token: string): PublicUser | null {
  const row = db.prepare(`SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`).get(hashToken(token), Date.now()) as PublicUser | undefined;
  return row ?? null;
}

export function deleteSession(token: string) { db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token)); }

export function getDashboard(user: PublicUser): DashboardData {
  const subscription = db.prepare("SELECT plan, status, expires_at AS expiresAt FROM subscriptions WHERE user_id = ?").get(user.id) as DashboardData["subscription"] | undefined;
  const devices = db.prepare("SELECT id, name, platform, created_at AS createdAt FROM devices WHERE user_id = ? ORDER BY created_at DESC").all(user.id) as DashboardData["devices"];
  const payments = db.prepare("SELECT order_id AS orderId, amount, status, created_at AS createdAt FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10").all(user.id) as DashboardData["payments"];
  return { user, subscription: subscription ?? { plan: "free", status: "inactive", expiresAt: null }, devices, payments };
}

export function addDevice(userId: string, name: string, platform: string) {
  const id = randomBytes(16).toString("hex");
  db.prepare("INSERT INTO devices (id, user_id, name, platform) VALUES (?, ?, ?, ?)").run(id, userId, name, platform);
  return id;
}

export function removeDevice(userId: string, id: string) {
  return db.prepare("DELETE FROM devices WHERE user_id = ? AND id = ?").run(userId, id).changes > 0;
}

export function createPaymentOrder(orderId: string, userId: string, planMonths: number, amount: string) {
  db.prepare("INSERT INTO payments (order_id, user_id, plan_months, amount) VALUES (?, ?, ?, ?)").run(orderId, userId, planMonths, amount);
}

export function markPaymentCreated(orderId: string, uuid: string, invoiceUrl: string) {
  db.prepare("UPDATE payments SET heleket_uuid = ?, invoice_url = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?").run(uuid, invoiceUrl, orderId);
}

export function failPaymentOrder(orderId: string) {
  db.prepare("UPDATE payments SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND status = 'pending'").run(orderId);
}

export function applyPayment(orderId: string, status: string) {
  const order = db.prepare("SELECT user_id, plan_months, status FROM payments WHERE order_id = ?").get(orderId) as { user_id: string; plan_months: number; status: string } | undefined;
  if (!order) return false;
  if (status !== "paid" && status !== "paid_over") {
    db.prepare("UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND status = 'pending'").run(status, orderId);
    return true;
  }
  if (order.status === "paid") return true;
  const current = db.prepare("SELECT expires_at FROM subscriptions WHERE user_id = ?").get(order.user_id) as { expires_at: string | null } | undefined;
  const prior = current?.expires_at ? new Date(current.expires_at) : new Date();
  const start = prior > new Date() ? prior : new Date();
  start.setMonth(start.getMonth() + order.plan_months);
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("UPDATE payments SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?").run(orderId);
    db.prepare("UPDATE subscriptions SET plan = 'premium', status = 'active', expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").run(start.toISOString(), order.user_id);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  return true;
}
