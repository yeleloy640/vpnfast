CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'inactive',
  expires_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS devices_user_id_idx ON devices(user_id);
CREATE TRIGGER IF NOT EXISTS enforce_device_limit
BEFORE INSERT ON devices
WHEN (SELECT COUNT(*) FROM devices WHERE user_id = NEW.user_id) >= 5
BEGIN
  SELECT RAISE(ABORT, 'device_limit_reached');
END;

CREATE TABLE IF NOT EXISTS payments (
  order_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_months INTEGER NOT NULL,
  amount TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  heleket_uuid TEXT,
  invoice_url TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS payments_user_created_idx ON payments(user_id, created_at DESC);

-- The transition from pending to paid extends the subscription once, even if Heleket retries a webhook.
CREATE TRIGGER IF NOT EXISTS activate_subscription_after_payment
AFTER UPDATE OF status ON payments
WHEN NEW.status = 'paid' AND OLD.status != 'paid'
BEGIN
  INSERT INTO subscriptions (user_id, plan, status, expires_at, updated_at)
  VALUES (
    NEW.user_id,
    'premium',
    'active',
    datetime('now', printf('+%d months', NEW.plan_months)),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  )
  ON CONFLICT(user_id) DO UPDATE SET
    plan = 'premium',
    status = 'active',
    expires_at = strftime(
      '%Y-%m-%dT%H:%M:%fZ',
      datetime(
        CASE WHEN julianday(subscriptions.expires_at) > julianday('now') THEN subscriptions.expires_at ELSE 'now' END,
        printf('+%d months', NEW.plan_months)
      )
    ),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');
END;
