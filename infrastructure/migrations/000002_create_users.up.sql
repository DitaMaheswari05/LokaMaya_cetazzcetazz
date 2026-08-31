-- 000002_create_users.up.sql
-- Membuat tabel users untuk autentikasi LokaMaya
-- Dijalankan oleh golang-migrate: migrate -path infrastructure/migrations -database $DATABASE_URL up

CREATE TABLE IF NOT EXISTS users (
    -- Primary key menggunakan UUID (dari extension uuid-ossp yang sudah diaktifkan di migration 000001)
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identitas user
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,

    -- Password di-hash dengan bcrypt (TIDAK pernah disimpan plaintext)
    password_hash TEXT         NOT NULL,

    -- Role untuk keperluan RBAC di masa depan (user | admin)
    role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'admin')),

    -- Timestamps
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index untuk query login (by email & username)
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Fungsi otomatis update updated_at setiap kali row diupdate
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
