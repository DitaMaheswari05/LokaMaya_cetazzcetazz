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
| Backend API | **Go (chi)** | REST API, business logic, spatial query, OSRM client, Redis cache |
| AI Microservice | **FastAPI + PyTorch** | IndoBERT klasifikasi, BGE-M3 embedding (dipanggil Go via HTTP) |
| AI Orchestration | **LiteLLM** | Router OpenAI-compatible → Google AI Studio / provider lain |
| Basis Data | PostgreSQL + PostGIS | Penyimpanan dan analisis data geospasial |
| RAG & Vector Store | BGE-M3 + pgvector | Pencarian semantik dokumen regulasi |
| NLP | IndoBERT | Klasifikasi Community Maps |
| Routing & Isochrone | OSRM | Analisis aksesibilitas berbasis jaringan jalan |
| Cache | Redis | Penyimpanan hasil query yang sering digunakan |
| Database Migration | golang-migrate | Plain SQL migration files |

---

## Arsitektur Service

```
Browser → Next.js (3000)
              ↓
         Go API (8080)
        /    |    \    \
   Postgres Redis OSRM  ai-service (8001)
   +PostGIS        (5000)  ↓
   +pgvector           IndoBERT + BGE-M3
              ↓
         LiteLLM (4000)
              ↓
         Google AI Studio / Provider lain
```

---

## Prasyarat

Pastikan semua tools berikut sudah terinstall sebelum memulai:

| Tool | Versi Minimum | Keterangan |
|---|---|---|
| [Node.js](https://nodejs.org) | 20.x LTS | Untuk menjalankan Next.js frontend |
| [Go](https://go.dev) | 1.23 | Untuk menjalankan Go backend |
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
│   │   ├── public/
│   │   └── src/
│   │       ├── app/                 # Next.js App Router
│   │       ├── components/          # Komponen React
│   │       ├── lib/                 # Integrasi MAPID SDK & API client
│   │       ├── hooks/
│   │       ├── types/
│   │       └── styles/
│   │
│   ├── api-go/                      # Go Backend (REST API Utama)
│   │   ├── cmd/
│   │   │   └── server/
│   │   │       └── main.go          # Entry point
│   │   ├── internal/
│   │   │   ├── config/              # Konfigurasi dari env variable
│   │   │   ├── database/            # Koneksi PostgreSQL (pgx) & Redis
│   │   │   ├── middleware/          # CORS, request logger
│   │   │   ├── router/              # Registrasi semua route (chi)
│   │   │   ├── handler/             # HTTP handler per domain
│   │   │   ├── service/             # Business logic per domain
│   │   │   ├── repository/          # Query database (pgx + sqlc)
│   │   │   ├── client/              # HTTP client ke OSRM, ai-service, LiteLLM
│   │   │   └── model/               # Struct data (GeoJSON, Regulation, Community)
│   │   ├── go.mod
│   │   └── Dockerfile
│   │
│   └── ai-service/                  # Python AI Microservice
│       ├── app/
│       │   ├── main.py              # Entry point FastAPI
│       │   ├── api/routes/          # /embed (BGE-M3) dan /classify (IndoBERT)
│       │   ├── core/                # Settings
│       │   └── ml/                  # Model loader singleton
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/
│   └── shared/
│       ├── types/                   # Type definitions bersama FE & BE
│       └── constants/               # Konstanta bersama (kode wilayah, dll)
│
├── infrastructure/
│   ├── docker/
│   │   └── postgres/
│   │       └── init.sql             # Inisialisasi PostGIS & pgvector extensions
│   ├── migrations/                  # golang-migrate SQL files
│   │   ├── 000001_init_extensions.up.sql
│   │   └── 000001_init_extensions.down.sql
│   └── docker-compose.yml           # Docker Compose khusus infrastruktur saja
├── data/
│   ├── regulations/                 # Dokumen regulasi tata ruang (input RAG)
│   └── spatial/                     # Data spasial & file OSRM (.osrm, .osm.pbf)
├── docs/
├── .env.template                    # Template environment variable
├── .gitignore
├── README.md
└── docker-compose.yml               # Docker Compose utama (semua service)
```

---

## Cara Menjalankan

> **Buat yang baru clone:** Ikuti step di bawah ini secara berurutan. Jangan skip step manapun.

---

### Step 1 — Install Prasyarat

Pastikan semua tools berikut sudah terinstall di komputermu:

| Tool | Versi | Link Download | Cek Instalasi |
|---|---|---|---|
| Git | terbaru | [git-scm.com](https://git-scm.com) | `git --version` |
| Docker Desktop | 24.x+ | [docker.com](https://www.docker.com/products/docker-desktop) | `docker --version` |
| Go | 1.23+ | [go.dev/dl](https://go.dev/dl) | `go version` |
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) | `node --version` |

> **Catatan:** Docker Desktop sudah include Docker Compose, jadi tidak perlu install terpisah.
> Pastikan Docker Desktop sedang **berjalan** sebelum melanjutkan.

---

### Step 2 — Clone Repository

```bash
git clone <repo-url>
cd LokaMaya
```

---

### Step 3 — Setup Environment Variables

```bash
# Salin template ke file .env
cp .env.template .env
```

Buka file `.env` dengan text editor, lalu isi nilai-nilai berikut:

| Variable | Nilai untuk Development Lokal | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Sudah diisi di template |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/lokamaya?sslmode=disable` | Sudah diisi di template |
| `REDIS_URL` | `redis://localhost:6379/0` | Sudah diisi di template |
| `NEXT_PUBLIC_MAPID_API_KEY` | _(minta ke tim)_ | API Key MAPID |
| `GOOGLE_AI_STUDIO_API_KEY` | _(minta ke tim)_ | API Key Google AI Studio |
| `LITELLM_API_KEY` | _(bebas, buat sendiri)_ | Contoh: `sk-lokamaya-dev` |

> **Yang wajib diisi manual:** `NEXT_PUBLIC_MAPID_API_KEY`, `GOOGLE_AI_STUDIO_API_KEY`, dan `LITELLM_API_KEY`.
> Sisanya sudah ada nilai default yang langsung bisa dipakai.

---

### Step 4 — Siapkan Data OSRM (Routing Pejalan Kaki)

OSRM butuh data peta Indonesia untuk menghitung rute. File ini besar (~500MB) dan tidak ikut di repo.

**4a.** Download data OpenStreetMap Indonesia dari [download.geofabrik.de](https://download.geofabrik.de/asia/indonesia.html)
→ Pilih file `indonesia-latest.osm.pbf`

**4b.** Letakkan file tersebut di folder:
```
data/spatial/indonesia-latest.osm.pbf
```

**4c.** Jalankan preprocessing OSRM (hanya perlu dilakukan **sekali**):

```bash
# Ekstrak data peta (butuh beberapa menit)
docker run -t -v ${PWD}/data/spatial:/data \
  ghcr.io/project-osrm/osrm-backend \
  osrm-extract -p /opt/foot.lua /data/indonesia-latest.osm.pbf

# Partition
docker run -t -v ${PWD}/data/spatial:/data \
  ghcr.io/project-osrm/osrm-backend \
  osrm-partition /data/indonesia-latest.osrm

# Customize
docker run -t -v ${PWD}/data/spatial:/data \
  ghcr.io/project-osrm/osrm-backend \
  osrm-customize /data/indonesia-latest.osrm
```

> **Windows (PowerShell):** Ganti `${PWD}` dengan path absolut folder project, contoh:
> ```powershell
> docker run -t -v "C:/Users/nama/LokaMaya/data/spatial:/data" ...
> ```

> **Skip dulu:** Jika tidak butuh fitur routing sekarang, bisa skip Step 4 ini. Service lain tetap bisa jalan normal.

---

### Step 5 — Build & Jalankan Semua Service

```bash
docker compose up --build
```

Proses ini akan memakan waktu **5-15 menit** pertama kali karena Docker perlu:
- Build image Go API (~2 menit)
- Build image Python AI service + download PyTorch (~10 menit)
- Pull image PostgreSQL, Redis, LiteLLM

Untuk run berikutnya (tanpa rebuild) cukup:
```bash
docker compose up
```

---

### Step 6 — Verifikasi Semua Service Berjalan

Buka browser atau gunakan terminal, cek satu per satu:

```bash
# Go API — harus return {"status":"ok","service":"lokamaya-api"}
curl http://localhost:8080/health

# AI Service — harus return {"status":"ok","service":"lokamaya-ai-service"}
curl http://localhost:8001/health

# Frontend — buka di browser
# http://localhost:3000
```

Atau cek status container semua service:
```bash
docker compose ps
```

Semua service harus berstatus **running** (atau **healthy**):

| Service | Port | Status yang Diharapkan |
|---|---|---|
| web (Next.js) | 3000 | running |
| api (Go) | 8080 | healthy |
| ai-service (Python) | 8001 | healthy _(butuh ~60 detik untuk load model)_ |
| litellm | 4000 | running |
| postgres | 5432 | healthy |
| redis | 6379 | healthy |
| osrm | 5000 | running _(jika data sudah dipreprocess)_ |

---

### Step 7 — Jalankan Database Migration

Setelah PostgreSQL berjalan, jalankan migration untuk inisialisasi schema:

```bash
# Install golang-migrate (hanya perlu sekali)
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Jalankan migration
migrate -path infrastructure/migrations \
  -database "postgres://postgres:postgres@localhost:5432/lokamaya?sslmode=disable" \
  up
```

---

### Perintah Berguna Sehari-hari

```bash
# Jalankan semua service di background
docker compose up -d

# Lihat log semua service (real-time)
docker compose logs -f

# Lihat log service tertentu saja
docker compose logs -f api
docker compose logs -f ai-service

# Restart satu service (tanpa rebuild yang lain)
docker compose restart api

# Rebuild dan restart satu service saja (setelah ada perubahan kode)
docker compose up --build api

# Hentikan semua service
docker compose down

# Hentikan dan hapus database (reset total)
docker compose down -v
```

---

### Troubleshooting

**Port sudah dipakai?**
```bash
# Cek proses yang pakai port tertentu (Windows)
netstat -ano | findstr :8080

# Hentikan container yang mungkin masih jalan
docker compose down
```

**ai-service terus restart?**
- Wajar, model loading butuh waktu. Tunggu ~60 detik, lalu cek lagi dengan `docker compose ps`.
- Jika tetap gagal, cek log: `docker compose logs ai-service`

**`go mod tidy` error saat development lokal?**
```bash
# Pastikan Go sudah terinstall dan versinya minimal 1.23
go version

# Download semua dependency
cd apps/api-go
go mod tidy
```

**Database migration gagal?**
- Pastikan PostgreSQL sudah running (`docker compose ps postgres`)
- Pastikan `DATABASE_URL` di `.env` sudah benar

---

## Environment Variables

Lihat [`.env.template`](.env.template) untuk daftar lengkap environment variable yang dibutuhkan.

| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL Go backend API (dari sisi browser) |
| `NEXT_PUBLIC_MAPID_API_KEY` | API Key MAPID Maps SDK |
| `DATABASE_URL` | Koneksi string PostgreSQL |
| `REDIS_URL` | Koneksi string Redis |
| `OSRM_URL` | URL service OSRM |
| `GO_API_PORT` | Port Go API server (default: 8080) |
| `AI_SERVICE_URL` | URL Python AI microservice (default: http://ai-service:8001) |
| `EMBEDDING_MODEL` | Model embedding untuk BGE-M3 (default: `BAAI/bge-m3`) |
| `LITELLM_URL` | URL LiteLLM proxy (default: http://litellm:4000) |
| `LITELLM_API_KEY` | API Key untuk autentikasi ke LiteLLM |
| `GOOGLE_AI_STUDIO_API_KEY` | API Key Google AI Studio (dipakai LiteLLM) |
