-- 000006_create_regulations_table.up.sql
-- Tabel regulasi tata ruang dan standar transit untuk pencarian semantik (RAG BGE-M3 + pgvector)

CREATE TABLE IF NOT EXISTS regulations (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    category    VARCHAR(100) NOT NULL DEFAULT 'tata_ruang', -- 'tata_ruang', 'standar_halte', 'aksesibilitas_disabilitas', 'kebencanaan', 'umkm'
    section     VARCHAR(100),
    content     TEXT NOT NULL,
    source      VARCHAR(255) NOT NULL,
    region      VARCHAR(100) DEFAULT 'DKI Jakarta',
    embedding   vector(1024), -- BGE-M3 menghasilkan vektor 1024 dimensi
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index HNSW untuk pencarian vektor cosine distance super cepat
CREATE INDEX IF NOT EXISTS idx_regulations_hnsw ON regulations USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_regulations_category ON regulations(category);
