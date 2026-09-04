-- 000003_add_role_to_users.down.sql
-- Rollback: hapus kolom role dan trigger dari tabel users

DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();
ALTER TABLE users DROP COLUMN IF EXISTS role;
