ALTER TABLE users ADD COLUMN google_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_idx ON users(google_sub) WHERE google_sub IS NOT NULL;
CREATE TABLE IF NOT EXISTS google_auth_nonces (
  nonce_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
