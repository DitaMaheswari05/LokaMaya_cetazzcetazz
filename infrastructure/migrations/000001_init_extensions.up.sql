-- 000001_init_extensions.up.sql
-- Inisialisasi PostgreSQL extensions yang dibutuhkan LokaMaya
-- Dijalankan otomatis oleh golang-migrate saat pertama kali setup

-- PostGIS: untuk menyimpan dan mengolah data geospasial
CREATE EXTENSION IF NOT EXISTS postgis;

-- pgvector: untuk menyimpan dan mencari embedding dokumen regulasi (RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- uuid-ossp: untuk generate UUID sebagai primary key
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
