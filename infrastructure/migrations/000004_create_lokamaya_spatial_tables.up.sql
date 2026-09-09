-- 000004_create_lokamaya_spatial_tables.up.sql
-- Membuat tabel geospasial LokaMaya: Halte, Rute, Community Maps, Struk Go, Menu Go, RDTR, InaRISK, Survey, dan Simulasi

-- 1. Halte TransJakarta (Existing Stops)
CREATE TABLE IF NOT EXISTS transjakarta_stops (
    id          VARCHAR(50) PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    corridor    VARCHAR(100),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    geom        GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transjakarta_stops_geom ON transjakarta_stops USING GIST(geom);

-- 2. Rute Koridor TransJakarta
CREATE TABLE IF NOT EXISTS transjakarta_routes (
    id          VARCHAR(50) PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    corridor    VARCHAR(50),
    geom        GEOMETRY(MultiLineString, 4326)
);
CREATE INDEX IF NOT EXISTS idx_transjakarta_routes_geom ON transjakarta_routes USING GIST(geom);

-- 3. Community Maps (MAPID Citizen Science & Aspirations)
CREATE TABLE IF NOT EXISTS community_maps (
    id                 SERIAL PRIMARY KEY,
    title              VARCHAR(255) NOT NULL,
    description        TEXT,
    category           VARCHAR(100) DEFAULT 'unclassified',
    confidence         DOUBLE PRECISION DEFAULT 0.0,
    is_transit_related BOOLEAN DEFAULT FALSE,
    geom               GEOMETRY(Point, 4326) NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_community_maps_geom ON community_maps USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_community_maps_transit ON community_maps(is_transit_related);

-- 4. Struk Go (MAPID Economic & Local Transaction Density)
CREATE TABLE IF NOT EXISTS struk_go (
    id                 SERIAL PRIMARY KEY,
    place_name         VARCHAR(255) NOT NULL,
    category           VARCHAR(100),
    transaction_count  INT NOT NULL DEFAULT 1,
    geom               GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_struk_go_geom ON struk_go USING GIST(geom);

-- 5. Menu Go (MAPID Informal/Formal MSMEs & Food Stalls)
CREATE TABLE IF NOT EXISTS menu_go (
    id                 SERIAL PRIMARY KEY,
    business_name      VARCHAR(255) NOT NULL,
    establishment_type VARCHAR(50) NOT NULL DEFAULT 'menetap', -- 'menetap' atau 'keliling'
    is_informal        BOOLEAN NOT NULL DEFAULT TRUE,
    price_range        VARCHAR(20) DEFAULT 'murah',
    geom               GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_menu_go_geom ON menu_go USING GIST(geom);

-- 6. RDTR 2022 Jakarta Satu (Land Use & Zoning Suitability)
CREATE TABLE IF NOT EXISTS rdtr_zones (
    id                 SERIAL PRIMARY KEY,
    zone_code          VARCHAR(50) NOT NULL,
    zone_name          VARCHAR(150) NOT NULL,
    transit_suitability VARCHAR(30) NOT NULL DEFAULT 'Sesuai', -- 'Sesuai', 'Bersyarat', 'Tidak Sesuai'
    geom               GEOMETRY(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rdtr_zones_geom ON rdtr_zones USING GIST(geom);

-- 7. Peta Rawan Banjir InaRISK / Jakarta Satu (Flood Hazard)
CREATE TABLE IF NOT EXISTS flood_hazard (
    id                 SERIAL PRIMARY KEY,
    risk_level         VARCHAR(30) NOT NULL, -- 'Rendah', 'Sedang', 'Tinggi'
    description        TEXT,
    geom               GEOMETRY(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_flood_hazard_geom ON flood_hazard USING GIST(geom);

-- 8. Survey Activities (20+ Titik Observasi Lapangan Tim LokaMaya)
CREATE TABLE IF NOT EXISTS survey_activities (
    id                 SERIAL PRIMARY KEY,
    location_name      VARCHAR(255) NOT NULL,
    surveyor_name      VARCHAR(100) NOT NULL,
    field_notes        TEXT NOT NULL,
    pain_points        TEXT,
    potentials         TEXT,
    geom               GEOMETRY(Point, 4326) NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_survey_activities_geom ON survey_activities USING GIST(geom);

-- 9. Riwayat Simulasi Perubahan Halte
CREATE TABLE IF NOT EXISTS simulation_runs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
    scenario_type           VARCHAR(30) NOT NULL, -- 'tambah', 'pindah', 'tutup'
    stop_name               VARCHAR(150) NOT NULL,
    walk_accessibility_score INT NOT NULL,
    umkm_economic_score     INT NOT NULL,
    feasibility_status      VARCHAR(30) NOT NULL,
    flood_risk              VARCHAR(30) NOT NULL,
    affected_routes         JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_narrative            TEXT,
    geom                    GEOMETRY(Point, 4326) NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_geom ON simulation_runs USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_user ON simulation_runs(user_id);

-- Seed data observasi lapangan dari Lampiran PRD (Stefany & Ivana)
INSERT INTO survey_activities (location_name, surveyor_name, field_notes, pain_points, potentials, geom)
VALUES
(
    'Halte Kemanggisan',
    'Stefany Josefina Santono',
    'Halte Kemanggisan berada di kawasan yang cukup ramai dengan adanya gedung perkantoran, hotel, area komersial, dan sekolah di sekitarnya. Kawasan ini padat dilalui kendaraan dan pejalan kaki.',
    'Akses trotoar pada jam sibuk cukup padat bersinggungan dengan kendaraan dari gang perumahan.',
    'Sangat potensial melayani pekerja kantoran, tamu hotel, dan pelajar di koridor Palmerah-Kemanggisan.',
    ST_SetSRID(ST_MakePoint(106.7972, -6.1914), 4326)
),
(
    'Halte Gelora Bung Karno 3',
    'Stefany Josefina Santono',
    'Akses strategis dekat kawasan GBK dengan jalur pedestrian lebar dan tertata rapi. Pengguna dari Halte Senayan Bank Jakarta tujuan GBK dapat transit di sini.',
    'Panas terik di siang hari saat berjalan di trotoar terbuka tanpa kanopi.',
    'Akses langsung fasilitas olahraga dan pusat perbelanjaan fX Sudirman.',
    ST_SetSRID(ST_MakePoint(106.8041, -6.2253), 4326)
),
(
    'Halte Widya Chandra Telkomsel',
    'Stefany Josefina Santono',
    'Kawasan perkantoran Jalan Gatot Subroto dekat Grha BPJamsostek. Titik transit penting pekerja koridor Gatot Subroto dengan fasilitas penunjang memadai.',
    'Arus lalu lintas jalan arteri sangat cepat, penyeberangan bergantung penuh pada JPO.',
    'Konsentrasi ribuan pekerja koridor bisnis Sudirman-Kuningan.',
    ST_SetSRID(ST_MakePoint(106.8164, -6.2307), 4326)
),
(
    'Halte Jelambar',
    'Stefany Josefina Santono',
    'Titik temu koridor barat Jakarta dekat RS Royal Taruma dan pusat perkantoran/kampus. Memiliki jembatan penyeberangan aman.',
    'Antrean transit koridor barat padat di jam pulang kerja.',
    'Integrasi permukiman Grogol dengan jaringan TransJakarta koridor 3 & 8.',
    ST_SetSRID(ST_MakePoint(106.7885, -6.1668), 4326)
),
(
    'Halte Simpang Kuningan',
    'Stefany Josefina Santono',
    'Berada di Jl. Gatot Subroto dekat Balai Kartini, Tempo Scan Tower, dan Bulog. Titik transit krusial konektivitas Kuningan-Gatot Subroto.',
    'Pertemuan arus lalu lintas flyover dan underpass Kuningan yang padat.',
    'Pusat mobilitas harian pegawai instansi pemerintah dan swasta multinasional.',
    ST_SetSRID(ST_MakePoint(106.8322, -6.2392), 4326)
),
(
    'Halte Senayan Bank Jakarta',
    'Stefany Josefina Santono',
    'Kawasan perkantoran Senayan, dekat fasilitas olahraga nasional, musala, toilet aksesibel, dan JPO lebar.',
    'Arus kendaraan di depan halte sangat ramai.',
    'Simpul transit utama integrasi koridor busway dengan distrik bisnis Senayan.',
    ST_SetSRID(ST_MakePoint(106.8025, -6.2238), 4326)
),
(
    'Halte Petamburan',
    'Stefany Josefina Santono',
    'Kawasan permukiman padat dan akses Slipi. Memiliki area drop-off motor dan papan informasi rute digital.',
    'Jalur pejalan kaki sekitar jalan arteri sering terhambat parkir ojek online.',
    'Menghubungkan warga permukiman Petamburan dan Slipi dengan koridor 9.',
    ST_SetSRID(ST_MakePoint(106.8005, -6.2001), 4326)
),
(
    'Stasiun MRT Bendungan Hilir',
    'Stefany Josefina Santono',
    'Kawasan sentra kuliner legendaris Benhil dan SCBD. Sangat terintegrasi dengan halte TransJakarta.',
    'Trotoar jalan kecil menuju sentra kuliner Benhil cukup sempit dan padat gerobak.',
    'Pusat kuliner UMKM ramai yang hidup dari pagi hingga malam.',
    ST_SetSRID(ST_MakePoint(106.8188, -6.2163), 4326)
),
(
    'Halte Tanjung Duren',
    'Stefany Josefina Santono',
    'Dekat pusat perbelanjaan Central Park, Mall Taman Anggrek, apartemen, dan ruko komersial. Memiliki akses JPO langsung.',
    'Jarak jalan kaki dari pemukiman warga non-apartemen agak terhalang jalan tol.',
    'Pusat belanja dan rekreasi warga Jakarta Barat dengan demand transit tinggi.',
    ST_SetSRID(ST_MakePoint(106.7908, -6.1772), 4326)
),
(
    'Halte Damai (Daan Mogot)',
    'Stefany Josefina Santono',
    'Berada di Jl. Daan Mogot, melayani Koridor 3 dan 3F serta feeder Koridor 8 dekat SPBU dan pusat perdagangan.',
    'Jalan arteri Daan Mogot berdebu dan kecepatan kendaraan sangat tinggi.',
    'Titik perpindahan komuter Tangerang-Kalideres menuju Jakarta Pusat/Selatan.',
    ST_SetSRID(ST_MakePoint(106.7621, -6.1592), 4326)
)
ON CONFLICT DO NOTHING;
