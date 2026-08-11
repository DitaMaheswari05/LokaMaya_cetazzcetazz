CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Aktifkan pgvector untuk RAG / vector similarity search (BGE-M3)
CREATE EXTENSION IF NOT EXISTS vector;

-- Aktifkan uuid-ossp untuk generate UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
