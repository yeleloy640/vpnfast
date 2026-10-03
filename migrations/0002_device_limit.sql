CREATE TRIGGER IF NOT EXISTS enforce_device_limit
BEFORE INSERT ON devices
WHEN (SELECT COUNT(*) FROM devices WHERE user_id = NEW.user_id) >= 5
BEGIN
  SELECT RAISE(ABORT, 'device_limit_reached');
END;
