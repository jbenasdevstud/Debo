CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  purchase_token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL,
  credits INTEGER NOT NULL,
  granted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON purchases(user_id);
