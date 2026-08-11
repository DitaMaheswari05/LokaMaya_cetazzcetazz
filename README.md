# LokaMaya

Platform WebGIS berbasis AI untuk analisis spasial, aksesibilitas, dan pengelolaan regulasi tata ruang di Indonesia.

---

## Tech Stack

| Lapisan | Teknologi | Fungsi |
|---|---|---|
| Basemap & Visualisasi | MAPID MAPS SDK | Layer spasial, isochrone, heatmap, marker |
| Frontend | React / Next.js | Antarmuka pengguna dan dashboard WebGIS |
| Pengelolaan Data Spasial | GEO MAPID Editor | Manajemen layer, atribut, publikasi data |
| Validasi Lapangan | MAPID Apps (Mission) | Survei kandidat lokasi secara geotag |
| Backend API | FastAPI | REST API, orkestrasi analisis, integrasi MCP |
| Basis Data | PostgreSQL + PostGIS | Penyimpanan dan analisis data spasial |
| RAG & Vector Store | BGE-M3 + pgvector | Pencarian semantik dokumen regulasi |
| NLP | IndoBERT | Klasifikasi Community Maps |
| Routing & Isochrone | OSRM | Analisis aksesibilitas berbasis jaringan jalan |
| AI Orchestration | Gemini Flash via MCP | Function calling dan penyusunan narasi |
| Cache | Redis | Penyimpanan hasil query yang sering digunakan |

---

## Prasyarat

Pastikan semua tools berikut sudah terinstall sebelum memulai:

| Tool | Versi Minimum | Keterangan |
|---|---|---|
| [Node.js](https://nodejs.org) | 20.x LTS | Untuk menjalankan Next.js frontend |
| [Python](https://python.org) | 3.12 | Untuk menjalankan FastAPI backend |
| [Docker](https://docker.com) | 24.x | Untuk menjalankan semua service via container |
| [Docker Compose](https://docs.docker.com/compose/) | 2.x | Sudah include di Docker Desktop |
| [Git](https://git-scm.com) | — | Version control |

---

## Struktur Direktori

```
project-root/
│
├── apps/
│   ├── web/                         # Next.js Frontend
│   │   ├── public/                  # Static assets (gambar, font, dll)
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router (halaman & layout)
│   │   │   │   ├── dashboard/       # Halaman dashboard utama
│   │   │   │   ├── map/             # Halaman visualisasi peta
│   │   │   │   ├── analysis/        # Halaman analisis spasial
│   │   │   │   └── api/             # Route handler Next.js (API internal)
│   │   │   ├── components/          # Komponen React yang reusable
│   │   │   │   ├── map/             # Komponen terkait peta (MAPID SDK)
│   │   │   │   ├── dashboard/       # Komponen chart dan statistik
│   │   │   │   ├── analysis/        # Komponen panel analisis
│   │   │   │   └── ui/              # Komponen UI generik (button, modal, dll)
│   │   │   ├── lib/                 # Logika & integrasi eksternal
│   │   │   │   ├── mapid/           # MAPID Maps SDK client & layer config
│   │   │   │   ├── api/             # HTTP client ke FastAPI backend
│   │   │   │   └── utils/           # Helper functions
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── types/               # TypeScript type definitions
│   │   │   └── styles/              # Global styles & CSS modules
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                         # FastAPI Backend
│       ├── app/
│       │   ├── main.py              # Entry point FastAPI, registrasi router
│       │   ├── api/
│       │   │   ├── routes/          # Endpoint per domain (map, analysis, dll)
│       │   │   └── dependencies.py  # Dependency injection (DB session, auth, dll)
│       │   ├── core/
│       │   │   ├── config.py        # Konfigurasi dari environment variable
│       │   │   ├── database.py      # Koneksi async PostgreSQL (asyncpg/SQLAlchemy)
│       │   │   └── cache.py         # Koneksi Redis
│       │   ├── models/              # SQLAlchemy ORM models (tabel database)
│       │   ├── schemas/             # Pydantic schemas (request/response validation)
│       │   ├── services/            # Business logic per domain
│       │   ├── routing/
│       │   │   └── osrm_client.py   # HTTP client ke OSRM (routing & isochrone)
│       │   ├── rag/
│       │   │   ├── embeddings.py    # BGE-M3 embedding generation
│       │   │   ├── retriever.py     # Semantic search via pgvector
│       │   │   ├── vector_store.py  # Manajemen vector store di PostgreSQL
│       │   │   └── documents/       # Dokumen regulasi tata ruang (PDF, txt, dll)
│       │   ├── nlp/
│       │   │   └── indo_bert.py     # IndoBERT untuk klasifikasi Community Maps
│       │   ├── mcp/
│       │   │   ├── client.py        # MCP client untuk Gemini Flash
│       │   │   └── tools/           # Definisi MCP tools (function calling)
│       │   └── cache/
│       │       └── redis_client.py  # Redis client wrapper
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/
│   └── shared/
│       ├── types/                   # Type definitions yang dipakai FE & BE
│       └── constants/               # Konstanta bersama (kode wilayah, dll)
│
├── infrastructure/
│   ├── docker/
│   │   ├── postgres/
│   │   │   └── init.sql             # Inisialisasi ekstensi PostGIS & pgvector
│   │   ├── osrm/                    # Konfigurasi OSRM (data peta, preprocessing)
│   │   └── redis/                   # Konfigurasi Redis (jika butuh custom)
│   ├── migrations/                  # Alembic database migrations
│   └── docker-compose.yml           # Docker Compose khusus untuk infrastruktur saja
│
├── data/
│   ├── regulations/                 # Dokumen regulasi tata ruang (input RAG)
│   └── spatial/                     # Data spasial & file OSRM (.osrm, .osm.pbf)
│
├── docs/
│   ├── architecture/                # Diagram arsitektur sistem
│   ├── api/                         # Dokumentasi API endpoint
│   └── database/                    # Skema & ERD database
│
├── .env.example                     # Template environment variable
├── .gitignore
├── README.md
└── docker-compose.yml               # Docker Compose utama (semua service)
```

---

## Cara Menjalankan

### 1. Clone & Setup Environment

```bash
git clone <repo-url>
cd LokaMaya

# Salin template env dan isi sesuai kebutuhan
cp .env.example .env
```

Edit file `.env` dan isi semua nilai yang diperlukan (API key, database password, dll).

### 2. Menjalankan dengan Docker (Direkomendasikan)

Cara paling mudah untuk menjalankan semua service sekaligus.

```bash
# Build dan jalankan semua service
docker compose up --build

# Jalankan di background
docker compose up --build -d

# Lihat log semua service
docker compose logs -f

# Hentikan semua service
docker compose down

# Hentikan dan hapus volume (reset database)
docker compose down -v
```

Setelah berhasil:
- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:8000
- **API Docs (Swagger)** → http://localhost:8000/docs
- **PostgreSQL** → `localhost:5432`
- **Redis** → `localhost:6379`
- **OSRM** → http://localhost:5000

---

### 3. Menjalankan secara Lokal (Development)

#### Frontend — Next.js

```bash
cd apps/web
npm install
npm run dev
```

Frontend berjalan di http://localhost:3000

#### Backend — FastAPI

```bash
cd apps/api

# Buat virtual environment
python -m venv .venv

# Aktifkan virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Jalankan development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend berjalan di http://localhost:8000

> **Catatan:** Untuk development lokal, pastikan PostgreSQL, Redis, dan OSRM sudah berjalan. Bisa jalankan hanya service infrastruktur via Docker:
> ```bash
> docker compose up postgres redis osrm -d
> ```

---

### 4. Setup OSRM (Routing & Isochrone)

OSRM membutuhkan data peta Indonesia yang diproses terlebih dahulu sebelum bisa digunakan.

```bash
# 1. Download data OpenStreetMap Indonesia
# Letakkan file .osm.pbf di folder data/spatial/

# 2. Preprocessing data (jalankan sekali)
docker run -t -v $(pwd)/data/spatial:/data \
  ghcr.io/project-osrm/osrm-backend \
  osrm-extract -p /opt/car.lua /data/indonesia.osm.pbf

docker run -t -v $(pwd)/data/spatial:/data \
  ghcr.io/project-osrm/osrm-backend \
  osrm-partition /data/indonesia.osrm

docker run -t -v $(pwd)/data/spatial:/data \
  ghcr.io/project-osrm/osrm-backend \
  osrm-customize /data/indonesia.osrm

# 3. Setelah preprocessing selesai, uncomment command OSRM di docker-compose.yml
```

---

### 5. Database Migration

```bash
cd apps/api

# Buat migration baru
alembic revision --autogenerate -m "nama_migration"

# Jalankan migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

---

## Environment Variables

Lihat [`.env.example`](.env.example) untuk daftar lengkap environment variable yang dibutuhkan.

| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL FastAPI backend (dari sisi browser) |
| `NEXT_PUBLIC_MAPID_API_KEY` | API Key MAPID Maps SDK |
| `DATABASE_URL` | Koneksi string PostgreSQL |
| `REDIS_URL` | Koneksi string Redis |
| `OSRM_URL` | URL service OSRM |
| `GEMINI_API_KEY` | API Key Google Gemini |
| `EMBEDDING_MODEL` | Model embedding untuk RAG (default: `BAAI/bge-m3`) |
| `MCP_SERVER_URL` | URL MCP server |
