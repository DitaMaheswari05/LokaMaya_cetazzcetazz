-- 000001_init_extensions.up.sql
-- Inisialisasi PostgreSQL extensions yang dibutuhkan LokaMaya
-- Dijalankan otomatis oleh golang-migrate saat pertama kali setup

-- PostGIS: untuk menyimpan dan mengolah data geospasial
-- Dibuat optional agar tidak blocking jika image tidak punya PostGIS
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS tidak tersedia, dilewati: %', SQLERRM;
END;
$$;

-- pgvector: untuk menyimpan dan mencari embedding dokumen regulasi (RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- uuid-ossp: untuk generate UUID sebagai primary key
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
