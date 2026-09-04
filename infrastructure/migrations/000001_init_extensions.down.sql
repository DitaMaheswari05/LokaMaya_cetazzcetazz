-- 000001_init_extensions.down.sql
-- Rollback: hapus extensions (jarang dipakai, tapi disediakan untuk completeness)

DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS vector;
DROP EXTENSION IF EXISTS postgis;
