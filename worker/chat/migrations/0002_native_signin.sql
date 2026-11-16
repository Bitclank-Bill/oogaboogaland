-- Native sign-in (docs/ooga-chat-backend.md, "Native clients"): a desktop app signs in through the system browser and
-- gets its session back on loopback (RFC 8252), proved with PKCE (RFC 7636, S256).

-- A sign-in a native app started: its PKCE challenge and the loopback port the browser is sent back to. Both null for
-- the web app's own sign-ins.
ALTER TABLE oauth_states ADD COLUMN native_challenge TEXT;
ALTER TABLE oauth_states ADD COLUMN native_port INTEGER;

-- The one-time code a finished native sign-in hands the app on loopback, kept by its SHA-256, good for two minutes and
-- for one exchange, and only with the verifier behind its challenge.
CREATE TABLE native_codes (
  code_hash TEXT PRIMARY KEY,
  principal_id TEXT NOT NULL REFERENCES principals(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX native_codes_expiry ON native_codes (expires_at);
