-- Stage 7: accounts are email and password; wallet sign-in is switched off.
--
-- Wallet connection returns when the blockchain integration is built. The
-- wallet columns (wallet_address, balance_*) and auth_nonces stay for that
-- work; nothing writes to them now.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;

-- One account per address, whatever its capitalisation.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower ON users (lower(email));
