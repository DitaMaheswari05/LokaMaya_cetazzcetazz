-- 000002_create_users.down.sql
-- Rollback: hapus tabel users dan semua objek terkait
-- Jalankan: migrate -path infrastructure/migrations -database $DATABASE_URL down 1

DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
