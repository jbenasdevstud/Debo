CREATE TABLE IF NOT EXISTS password_resets (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL,
  last_sent_at INTEGER NOT NULL
);
ALTER TABLE users ADD COLUMN password_changed_at INTEGER NOT NULL DEFAULT 0;
