# LokaMaya (WebGIS Spatial AI for Urban Transit Planning)
### Platform Analisis Spasial Berbasis AI untuk Aksesibilitas Transit, Integrasi UMKM, dan Tata Ruang Perkotaan

---

## 1. Ringkasan Eksekutif & Visi Platform

**LokaMaya** adalah platform WebGIS berbasis Spatial AI cerdas yang dirancang untuk membantu perencana kota (*urban planners*), dinas perhubungan, pengelola transportasi massal, serta masyarakat sipil dalam merumuskan keputusan transportasi perkotaan yang berbasis data (*data-driven urban transit planning*). 

Di kota megapolitan seperti DKI Jakarta, tantangan konektivitas mobilitas tidak hanya terletak pada pengadaan armada busway besar, melainkan pada **titik sambung pertama dan terakhir (*first-mile & last-mile accessibility*)**, **diskontinuitas antarkoridor**, hambatan fisik pedestrian, serta keterpaduan simpul transit dengan perekonomian warga kecil (UMKM).

LokaMaya mengintegrasikan:
1. **Analitik Geospasial Deterministik**: Komputasi PostGIS (EPSG:4326), jaringan jalan riil OpenStreetMap (OSRM), dan layer spasial RDTR 2022 serta peta bahaya banjir InaRISK.
2. **Konteks Sosio-Ekonomi Mikro MAPID**: Peta aspirasi mobilitas warga (Community Maps), transaksi belanja mikro (Struk Go), dan sebaran pedagang kaki lima / usaha informal (Menu Go).
3. **Orkestrasi AI Multi-Agent & RAG Berbasis Regulasi**: Konsultan tata kota multi-persona (*Urban Planning Council*) yang didasarkan pada perundangan resmi (UU 22/2009, Permenhub 10/2012, Pergub DKI 31/2022) menggunakan embeddings BGE-M3 (1024 dimensi) dan pencarian semantik pgvector.

---

## 2. Arsitektur Sistem & Stack Teknologi

LokaMaya menggunakan arsitektur modular yang memisahkan pemrosesan spasial performa tinggi dengan antarmuka interaktif:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 16 CLIENT (PORT 3000)                   │
│   - Unified Fluid Map Canvas (MapLibre GL + OSM Raster Basemap)       │
│   - AI Copilot Omnibar & Smart Contextual Action Bar                  │
│   - Visualisasi Rute Komuter Riil (As-Is vs To-Be) & Isochrone Pedestrian│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          GO API BACKEND (PORT 8080)                    │
│   - Chi Router & High-Performance Geospatial Handlers                  │
│   - Spatial Repository: Formula Friksi, Scoring, Catchment Populasi    │
│   - 4-Tier Anti-Gang Snapping Engine (ST_ClosestPoint BRT Corridors)   │
│   - OSRM Client Connector (Foot & Driving Profiles)                    │
└───────┬───────────────────────────┬────────────────────────────┬───────┘
        │ SQL / PostGIS / pgvector  │ Routing Engine             │ AI / RAG
        ▼                           ▼                            ▼
┌─────────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│    POSTGRESQL 16 +      │  │   OSRM ENGINE    │  │   AI SERVICE &      │
│         POSTGIS         │  │   (PORT 5000 /   │  │   LITELLM (RAG)     │
│ - transjakarta_routes   │  │  PUBLIC FALLBACK)│  │ - BGE-M3 Embeddings │
│ - transjakarta_stops    │  │ - Foot Routing   │  │ - IndoBERT Transit  │
│ - rdtr_zones            │  │ - Car/Bus Routing│  │ - Urban Council     │
│ - flood_hazard          │  │ - Isochrone Grid │  │   Multi-Agent       │
│ - struk_go & menu_go    │  └──────────────────┘  └─────────────────────┘
│ - community_maps        │
│ - regulations (pgvector)│
└─────────────────────────┘
```

| Komponen | Teknologi | Peran & Tanggung Jawab |
|---|---|---|
| **Frontend** | Next.js 16 (Turbopack, React 19, Tailwind CSS v4) | Single Page WebGIS, rendering MapLibre GL, widget chat AI interaktif, dan visualisasi rute. |
| **Backend API** | Go 1.23 (Chi router, pgx) | Komputasi analitik spasial instan, kalkulasi friksi OD, validasi snapping arteri, dan pipeline orkestrasi data. |
| **Database Spasial** | PostgreSQL 16 + PostGIS 3.4 | Penyimpanan 7 core layers, indeks spasial GiST, query `ST_DWithin`, `ST_ClosestPoint`, dan `ST_Contains`. |
| **Vector Database** | pgvector | Indeks vektor HNSW untuk pencarian semantik pasal-pasal regulasi tata ruang (dimensi 1024). |
| **Routing Engine** | OSRM (Open Source Routing Machine) | Komputasi rute jalan riil (profil kaki dan kendaraan umum) serta kurva belokan jalan perkotaan. |
| **AI Orchestration** | LiteLLM / Ollama / OpenRouter | Routing model LLM (Claude / GPT / Qwen / DeepSeek) dengan sistem RAG terintegrasi ke Go backend. |

---

## 3. Fitur-Fitur Utama Platform

### A. Unified Fluid Map & AI Copilot Omnibar (`/peta-simulasi`)
* **Peta Kanvas Bebas-Hambatan**: Tidak ada lagi tombol segmented mode kaku yang memaksa pengguna memilih mode "tambah", "pindah", atau "analisis". Peta selalu aktif dan interaktif.
* **Omnibar Cerdas Multifungsi**: Kolom pencarian di kanan atas merangkap sebagai portal AI Copilot. Pengguna dapat mengetikkan nama lokasi, koordinat, maupun perintah natural seperti:
  * *"Analisis bottleneck perjalanan dari Dukuh Atas ke Senayan"*
  * *"Tampilkan kepadatan UMKM di sekitar sini"*
  * *"Simulasikan penambahan halte baru di dekat Tebet Eco Park"*
* **Smart Contextual Action Bar**: Mengklik sembarang titik di peta akan langsung memunculkan menu mengambang kontekstual:
  * `[ 💬 Tanya AI ]`: Mengkaji potensi dan kondisi titik dengan konsultan AI.
  * `[ 🚏 Simulasi Halte Baru ]`: Menguji kelayakan penempatan halte dan isochrone 5–15 menit.
  * `[ 📍 Set Titik A ]`: Menetapkan sebagai titik awal perjalanan komuter.
  * `[ 🏁 Set Titik B ]`: Menetapkan sebagai titik tujuan perjalanan komuter.
* **Aksi Cepat pada Halte Eksisting TransJakarta**: Mengklik marker halte TransJakarta membuka popup dengan opsi simulasi performa, evaluasi pemindahan halte, serta penetapan titik awal/akhir rute.

---

### B. Analisis Bottleneck Perjalanan Komuter (Origin-Destination OD Trip)
* **Diagnosis Multi-Faktor**: Mendiagnosis perjalanan warga antara dua titik koordinat sembarang di Jakarta berdasarkan beban fisik, keselamatan, dan diskontinuitas transit.
* **Metrik First-Mile & Last-Mile**: Mengukur jarak dan waktu jalan kaki riil dari rumah ke halte keberangkatan, serta dari halte kedatangan ke lokasi tujuan akhir.
* **Deteksi Diskontinuitas Koridor**: Mengevaluasi apakah komuter memiliki rute langsung (*direct transit*) atau dipaksa melakukan transfer antarkoridor. Sistem secara cerdas menyebutkan nama rute spesifik (misal: *Rute 1 (Blok M - Kota)* atau *Feeder Mikrotrans JAK-10*), bukan sekadar label koridor generik.
* **Visualisasi Geometri Jalan Riil**: Jalur perjalanan tidak digambar sebagai garis lurus diagonal, melainkan mengikuti bentuk kelokan jalan arteri, jembatan layang (*flyover*), dan trotoar perkotaan via OSRM.

---

### C. Anti-Gang Snapping Engine (Hierarki 4-Tier Penempatan Halte)
Salah satu fitur terpenting LokaMaya adalah pencegahan penempatan halte di gang sempit pemukiman warga (*anti-gang rule*). Ketika pengguna memilih titik di dalam pemukiman padat, mesin spasial secara ketat memproyeksikan halte usulan ke koridor jalan arteri terdekat:
1. **Tier 1 (Radius $\le 850\text{m}$ dari Koridor BRT)**: PostGIS `ST_ClosestPoint` memproyeksikan halte tepat ke sumbu jalan arteri rute BRT utama (misal Jl. H.R. Rasuna Said, Jl. Sudirman, Jl. Gatot Subroto).
2. **Tier 2 (Area Suburban $\le 1.200\text{m}$)**: Menarik titik ke halte eksisting di jalan arteri/kolektor (memfilter kata kunci `raya`, `boulevard`, `arteri`, `simpang`, dan menolak kata kunci lokal seperti `gang`, `komplek`, `taman`).
3. **Tier 3 (Validasi Ruas Jalan OSRM)**: Menguji koordinat jalan terdekat via OSRM dan memverifikasi fungsi filter `isArterialOrCollectorStreet` serta `!isLocalStreet`.
4. **Tier 4 (Sumbu Transit Eksisting)**: Menambatkan ke sumbu halte resmi terdekat (*refStop*).

> **Safeguard Pencegah Halte Palsu**: Jika jarak jalan kaki komuter di titik asal dan tujuan sudah berada dalam batas wajar standar perkotaan ($\le 480\text{m}$), sistem secara otomatis menyatakan bahwa infrastruktur eksisting telah optimal (`action: "none"`), sehingga tidak memunculkan usulan halte fiktif yang tidak dibutuhkan.

---

### D. Simulasi Komparatif Komuter: Skenario As-Is vs To-Be
* **Jalur As-Is (Garis Putus-Putus Abu-Abu)**: Rute eksisting saat ini yang harus ditempuh warga dengan halte-halte yang ada, lengkap dengan friksi transfer dan jalan kaki jauh.
* **Jalur To-Be (Garis Hijau Emerald Tebal)**: Rute simulasi setelah dilakukan intervensi penempatan halte usulan baru atau pemindahan halte.
* **Kartu Ringkasan Dampak Terukur**:
  * Penghematan waktu perjalanan (dalam menit).
  * Pemotongan jarak jalan kaki pedestrian (dalam meter).
  * Persentase peningkatan efisiensi perjalanan komuter.
  * Tingkat beban pejalan kaki (*Pedestrian Strain Level*): Sangat Berat, Sedang, atau Nyaman/Ideal.
* **Breakdown Langkah Perjalanan (Journey Steps)**:
  * Tahap 1: Jalan kaki first-mile dari pemukiman ke halte awal.
  * Tahap 2: Naik bus TransJakarta rute spesifik menuju halte tujuan (termasuk transfer jika ada).
  * Tahap 3: Jalan kaki last-mile dari halte akhir ke tempat tujuan.

---

### E. Aksesibilitas Pejalan Kaki & Analisis Isochrone Catchment
* **Isochrone Poligon 5, 10, dan 15 Menit**: Menghasilkan area tangkapan jangkauan pejalan kaki berbasis graf trotoar dan jalan lokal OpenStreetMap.
* **Skor Aksesibilitas Pejalan Kaki (0–100)**:
  $$\text{Score} = \operatorname{clamp}(\text{TransitGap } [45\%] + \text{Vitality } [35\%] + \text{ZoneScore } [20\%], 35, 96)$$
  * Memberikan nilai tertinggi jika mengisi celah transit ideal (350m–750m dari halte lain).
  * Memberikan penalti jika jarak terlalu dekat ($<200\text{m}$) untuk menghindari kanibalisasi antarisland halte.
  * Mengintegrasikan estimasi jumlah populasi warga yang terlayani dalam radius jalan kaki 5 dan 10 menit.

---

### F. Vitalitas Ekonomi Mikro & Klaster UMKM
* **Agregasi Radius 500 Meter**: Menghitung kepadatan transaksi ekonomi mikro pejalan kaki melalui data Struk Go serta rasio pedagang kaki lima / usaha keliling melalui data Menu Go.
* **Skor Vitalitas UMKM (35–96)**:
  $$\text{VitEcon} = \operatorname{clamp}(\operatorname{round}(\text{Trx}_{\text{Struk}} \times 0.15) + (\text{InformalVendors} \times 2), 35, 96)$$
* **Konsep Transit Retail Micro-Hub**: Memberikan rekomendasi penempatan simpul transit yang mampu mendongkrak omzet pelaku ekonomi informal di sekitar halte tanpa mengganggu kelancaran arus pedestrian.

---

### G. AI Urban Planning Council & Legal RAG Grounding
* **4 Persona Ahli Perencanaan Kota**:
  1. *Ahli Tata Kota & Zonasi (RDTR)*: Memverifikasi kesesuaian ruang K1/K2, intensitas bangunan, dan kepatuhan terhadap Pergub DKI 31/2022.
  2. *Analis Transit & Mobilitas*: Membedah efisiensi koridor, waktu tempuh, dan kapasitas layanan armada bus.
  3. *Advokat Ekonomi Kerakyatan*: Mengkaji potensi peningkatan pendapatan UMKM dan formalisasi pedagang binaan.
  4. *Penilai Risiko Lingkungan & Bencana*: Memeriksa kerentanan terhadap peta bahaya banjir InaRISK BNPB.
* **Prinsip Deterministic Grounding**: AI berperan sebagai interpreter naratif dan konsultan sintesis kebijakan. AI **tidak pernah mengubah, mengarang, atau memanipulasi angka metrik spasial** yang dihitung oleh PostGIS.

---

### H. Halaman Metodologi & Sumber Data (`/metodologi`)
Halaman edukatif dan transparan yang menjelaskan rincian katalog 7 layer dataset spasial, formula matematis perhitungan skor, diagram hierarki snapping arteri, arsitektur multi-agent, serta pengungkapan jujur atas 5 keterbatasan teknis platform.

---

## 4. Cara Kerja Teknis (Step-by-Step Flow)

### 1. Alur Analisis Bottleneck OD Trip (Titik A $\to$ Titik B)
1. Pengguna menentukan Titik A dan Titik B (melalui klik peta, popup halte, atau input perintah ke AI Omnibar).
2. Frontend mengirim permintaan ke endpoint Go backend `POST /api/v1/analysis/od-trip`.
3. Backend PostGIS mencari halte TransJakarta terdekat untuk Titik A (`origStop`) dan Titik B (`destStop`).
4. Backend mengecek irisan rute (`hasCommonRoute`) dan query bahaya banjir InaRISK pada koordinat asal, tujuan, dan titik tengah.
5. Menghitung **Skor Friksi** deterministik:
   $$\text{Friction} = \operatorname{round}\left(\frac{\text{firstMile}}{20} + \frac{\text{lastMile}}{24}\right) + P_{\text{transfer}} + P_{\text{flood}}$$
6. Jika `firstMile > 480m` atau `lastMile > 480m`, fungsi `snapToArterialCorridor` dijalankan untuk menentukan lokasi halte usulan baru di jalan arteri terdekat.
7. Backend merekonstruksi rute jalan riil OSRM untuk skenario **As-Is** dan **To-Be**, menghitung selisih efisiensi, dan mengembalikan GeoJSON lengkap beserta rekomendasi naratif ke frontend.
8. Frontend merender layer GeoJSON (garis putus-putus abu-abu untuk As-Is, garis hijau emerald untuk To-Be, marker halte usulan oranye/biru) dan membuka panel ringkasan komparatif.

---

### 2. Alur Simulasi Halte Baru & Evaluasi Aksesibilitas
1. Pengguna mengklik suatu titik di peta dan memilih `[ 🚏 Simulasi Halte Baru ]`.
2. Frontend memanggil endpoint Go `POST /api/v1/simulations`.
3. Backend mengeksekusi analisis multi-layer:
   * Menghitung jarak ke halte eksisting terdekat dan densitas halte dalam 800m.
   * Menghitung transaksi Struk Go dan pedagang Menu Go dalam radius 400m–500m.
   * Mengecek zona RDTR setempat via `ST_Contains`.
   * Memvalidasi risiko banjir InaRISK.
   * Menghasilkan poligon isochrone jalan kaki 5, 10, dan 15 menit via OSRM.
4. Menghitung Skor Aksesibilitas Pejalan Kaki (0–100) dan estimasi warga terlayani.
5. Hasil disajikan dalam panel hasil simulasi lengkap dengan poligon isochrone warna-warni di atas peta.

---

### 3. Alur Interaksi AI Copilot & Urban Council (RAG)
1. Pengguna mengajukan pertanyaan di AI Omnibar atau widget chat.
2. Go backend meneruskan konteks spasial terkini (koordinat, hasil simulasi, status bottleneck) ke AI Service.
3. Vektor query dicocokkan dengan tabel `regulations` menggunakan `pgvector` untuk mengambil pasal dan dasar hukum yang relevan.
4. LLM merespons dengan struktur narasi konsultan kota yang mengintegrasikan data empiris spasial dengan pasal regulasi yang sah.

---

## 5. Keterbatasan Sistem & Asumsi Pemodelan (Known Limitations)

Secara transparan, platform LokaMaya memiliki beberapa batasan operasional dan asumsi yang perlu dipahami oleh perencana kota:

### 1. Ketiadaan Telemetri Live GPS Armada (Static Headway & Transit Speed Assumption)
Waktu tempuh busway dihitung berdasarkan kecepatan operasional rata-rata TransJakarta (~18–25 km/jam) dan estimasi *headway* standar antar-armada (8–15 menit). Platform saat ini **belum terhubung langsung ke feed GPS live (GTFS-Realtime)** per detik armada bus. Akibatnya, kemacetan ekstrem situasional di luar jalur busway steril belum tercermin secara dinamis per detik.

### 2. Variasi Kerapatan Data MAPID di Kawasan Suburban (Fringe Sparsity)
Data UMKM (Struk Go & Menu Go) dan Community Maps memiliki tingkat kerapatan yang sangat tinggi di kawasan pusat aktivitas (Jakarta Pusat, Jakarta Selatan, dan koridor arteri primer), namun cenderung lebih jarang (*sparse*) di wilayah perbatasan suburban luar (seperti pinggiran Jakarta Timur atau Jakarta Barat terluar). Pada titik yang tidak memiliki data transaksi fisik, model menggunakan fungsi estimasi deterministik terstandarisasi untuk menjaga keutuhan simulasi.

### 3. Ketergantungan pada Tagging Hierarki Jalan OpenStreetMap (OSM)
Mesin *Arterial Snapping* mengandalkan klasifikasi jalan OSM (`highway=primary`, `secondary`, `trunk`). Pada segmen tertentu di Jakarta di mana komunitas OSM belum memperbarui tag hierarki jalan atau terdapat inkonsistensi penamaan jalan sekunder/kolektor, sistem mengandalkan lapisan cadangan (Tier 2 & Tier 4) untuk menambatkan halte ke sumbu jaringan halte resmi terdekat.

### 4. Hambatan Mikro-Pedestrian Fisik yang Belum Terpetakan
Model jarak jalan kaki mengasumsikan pejalan kaki sehat dengan kecepatan standar 75 meter/menit (4,5 km/jam) mengikuti trotoar dan jalan lokal OSM. Hambatan mikro temporer seperti galian utilitas jalan, trotoar rusak yang terhalang parkir liar, atau ketiadaan eskalator/lift pada JPO tertentu belum dihitung sebagai penalti waktu mikro.

### 5. Mekanisme Fallback Dual-Engine Routing
Sistem mengutamakan komputasi rute jalan kaki dan transit melalui container microservice OSRM lokal. Jika engine lokal mengalami kendala latensi atau *timeout* (>2 detik), sistem menerapkan *graceful fallback* ke pendekatan interpolasi kurva arteri dan Manhattan Grid guna memastikan antarmuka tetap responsif bagi pengguna tanpa mengalami *blank error*.

---

## 6. Panduan Menjalankan Aplikasi (Setup & Deployment)

### Prasyarat Perangkat Lunak
* **Node.js**: v20.x LTS atau lebih baru
* **Go**: v1.23 atau lebih baru
* **Docker & Docker Compose**: v2.x (Docker Desktop)
* **PostgreSQL + PostGIS**: (dijalankan via Docker container)

### Langkah Instalasi

1. **Clone Repository**:
   ```bash
   git clone https://github.com/DitaMaheswari05/LokaMaya_cetazzcetazz.git
   cd LokaMaya_cetazzcetazz
   ```

2. **Konfigurasi Environment Variables**:
   Salin `.env.template` menjadi `.env` dan sesuaikan variabel kunci:
   ```bash
   cp .env.template .env
   ```

3. **Menjalankan Service Database & Backend via Docker**:
   ```bash
   docker-compose up -d postgres redis api
   ```
   *Database PostgreSQL + PostGIS akan otomatis memuat migrasi dan data awal.*

4. **Menjalankan Frontend Web**:
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```
   *Aplikasi web akan dapat diakses di `http://localhost:3000`.*

5. **Akses URL Utama**:
   * **Dashboard & Landing Page**: `http://localhost:3000/`
   * **Peta Simulasi & AI Copilot**: `http://localhost:3000/peta-simulasi`
   * **Dokumentasi Metodologi & Formula**: `http://localhost:3000/metodologi`
   * **REST API Health Check**: `http://localhost:8080/healthz`

---

## 7. Ringkasan Endpoint Utama REST API Go (`apps/api-go`)

| Endpoint | Method | Parameter Utama | Deskripsi Fungsi |
|---|---|---|---|
| `/healthz` | GET | — | Memeriksa status kesehatan server Go API. |
| `/api/v1/spatial/layers` | GET | `bbox`, `layer_type` | Mengambil data GeoJSON layer (stops, routes, rdtr, flood, umkm). |
| `/api/v1/simulations` | POST | `{latitude, longitude, action_type}` | Menghitung isochrone, walkability score, dan kelayakan zonasi halte. |
| `/api/v1/analysis/od-trip` | POST | `{origin_lat, origin_lng, dest_lat, dest_lng}` | Analisis friksi komuter, bottleneck, snapping arteri, dan rute As-Is vs To-Be. |
| `/api/v1/ai/chat` | POST | `{message, context}` | Berinteraksi dengan AI Copilot & Urban Planning Council berbasis RAG regulasi. |

---

*LokaMaya — Bridging Spatial Science and Urban Empathy for Jakarta's Commuters.*
