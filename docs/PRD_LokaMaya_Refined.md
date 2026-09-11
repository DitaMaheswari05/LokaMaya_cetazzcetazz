# PRODUCT REQUIREMENT DOCUMENT (PRD) — REFINED & ENHANCED
## LokaMaya: WebGIS - Spatial Intelligence untuk Transportasi Massal
**MAPID WEBGIS COMPETITION #2 - 2026: Maps That Think! - Mass Transportation Edition**

| Parameter | Keterangan |
|---|---|
| **Nama Tim** | cetazz cetazz |
| **Judul Proyek** | LokaMaya (Lokasi & Analisis Tata Ruang Terpadu Berbasis AI) |
| **Institusi** | Institut Teknologi Bandung (ITB) |
| **Ketua Tim** | Stefany Josefina Santono (Project Leader) |
| **Anggota Tim** | Aulia Azka Azzahra (UI/UX Designer), Dita Maheswari (WebGIS Developer), Theresia Ivana Marella Siswahyudi (Product/Business Analyst), Ahmad Syafiq (Data & AI Analyst) |
| **Versi Dokumen** | 2.1 (Enhanced: Hybrid Deterministic-Generative AI & MCP Server) |
| **Status Dokumen** | Approved for Implementation |

---

## 1. Ringkasan Eksekutif & Problem Statement

### 1.1 Problem Statement
Keputusan perencanaan fasilitas transportasi massal (khususnya penambahan, pemindahan, atau penutupan halte TransJakarta) kerap menghadapi tantangan krusial:
1. **Silo Data & Fragmentasi:** Data akses pejalan kaki, keberadaan UMKM/ekonomi informal, kepatuhan tata ruang (RDTR 2022), dan risiko kebencanaan (rawan banjir) tersebar di berbagai instansi dan format yang tidak terintegrasi.
2. **Ketiadaan Alat Simulasi Berbasis Bukti bagi Warga:** Masyarakat dan pelaku UMKM tidak memiliki instrumen data kuantitatif untuk memvalidasi dampak pemindahan halte terhadap akses harian maupun keberlangsungan usaha mikro.
3. **Kompleksitas Analisis Spasial & Dinamika Sosial:** Pengambil kebijakan di Dishub/Pemda tidak hanya memerlukan hitungan jarak jalan, namun juga butuh memprediksi dampak sosial, resistensi warga, dan efek domino ekonomi lokal sebelum kebijakan dieksekusi.

### 1.2 Solusi LokaMaya: "Hybrid Spatial-Agentic Intelligence"
LokaMaya adalah platform **WebGIS Spatial Intelligence** yang menggabungkan:
1. **Deterministic Spatial Computation Engine (PostGIS + OSRM):** Menjamin $100\%$ akurasi matematis tanpa halusinasi pada perhitungan jarak jalan kaki (isochrone 5–10 menit), densitas UMKM (Struk Go & Menu Go), dan kepatuhan zonasi RDTR.
2. **Generative & Probabilistic AI Engine (Model Context Protocol / MCP + Gemini 1.5 Flash):** Memberikan kapabilitas *"Maps That Think!"* sesungguhnya melalui:
   * **Simulasi Musyawarah Multi-Agent (AI Urban Council):** Menyimulasikan debat sosial dari 3 persona virtual (Warga, UMKM, Dishub) untuk mengukur *Social Acceptance Rate*.
   * **Pencarian Titik Optimal Otonom (Inverse Spatial Exploration):** AI menelusuri koridor jalan dan menemukan titik-titik halte terbaik secara multi-objektif (*Pareto-optimal*).
   * **Prediksi Efek Domino Perilaku (Behavioral Shift):** Memproyeksikan pergeseran moda transportasi pejalan kaki dan relokasi pedagang informal.
   * **Naskah Kebijakan Otomatis (One-Click Policy Brief):** Menyusun naskah advokasi formal siap serah untuk Pemprov/Dishub.

---

## 2. Tujuan Produk & Target Success Metrics

### 2.1 Tujuan (Goals)
1. **Simulasi Dampak Komprehensif:** Menyediakan evaluasi instan 3 skor kuantitatif terukur ($S_{\text{walk}}$, $S_{\text{umkm}}$, Kelayakan Lokasi).
2. **Orkestrasi Berstandar MCP:** Mengekspos seluruh fungsionalitas komputasi spasial melalui protokol resmi **Model Context Protocol (MCP)** via transport HTTP-SSE/JSON-RPC.
3. **Penalaran Sosio-Spasial Berbasis Multi-Agent:** Mengubah data kaku menjadi simulasi deliberasi stakeholder yang hidup dan solutif.
4. **Eksplorasi Rekomendasi Titik Cerdas:** Mengotomasi pencarian kandidat lokasi halte optimal tanpa mengharuskan pengguna menebak-nebak koordinat.
5. **Advokasi Kebijakan Berbasis Bukti:** Memberikan naskah policy brief dan ringkasan ekspor (PDF/PNG) sebagai dokumen advokasi aspirasi masyarakat.

### 2.2 Success Metrics
* **Kecepatan Analisis Deterministik:** Hasil simulasi 3 skor + isochrone poligon selesai dalam waktu $< 3.5\text{ detik}$.
* **Kecepatan Musyawarah Multi-Agent:** Simulasi musyawarah 3 agen virtual selesai dalam $< 4.0\text{ detik}$ (streaming via LiteLLM/Gemini).
* **Integritas Komputasi:** $0\%$ halusinasi numerik pada skor; seluruh angka bersumber langsung dari PostGIS.
* **Standarisasi Protokol:** $100\%$ tools spasial dan penalaran dapat diakses via MCP client (seperti Claude Desktop/Cursor) maupun antarmuka WebGIS internal.
* **Efektivitas Eksplorasi Otonom:** Menghasilkan 3 alternatif titik terbaik dari koridor jalan dalam $< 6.0\text{ detik}$ menggunakan goroutine komputasi paralel.

---

## 3. User Personas

### Persona 1: Rina (Warga & Penumpang Harian TransJakarta)
* **Profil:** 29 tahun, pekerja komuter di Jakarta Selatan/Pusat.
* **Tujuan:** Memastikan pemindahan halte tidak memperjauh jarak jalan kaki, tidak memutus rute transit hariannya, dan melihat pertimbangan keamanan rute pejalan kaki.
* **Kebutuhan:** Antarmuka chat ramah, peta jangkauan waktu tempuh, dan dokumen bukti aspirasi warga.

### Persona 2: Andi (Staf Perencana Transportasi Pemda / Dishub)
* **Profil:** 41 tahun, praktisi kebijakan transportasi publik perkotaan.
* **Tujuan:** Menentukan lokasi halte yang memaksimalkan jangkauan warga, meminimalkan konflik sosial pedagang informal, dan patuh regulasi tata ruang bebas banjir.
* **Kebutuhan:** Eksplorasi titik halte optimal otonom, simulasi reaksi stakeholder (AI Council), serta ringkasan dokumen naskah kebijakan siap rapat pimpinan.

### Persona 3: Siti (Pelaku UMKM / Pemilik Usaha Kuliner Sekitar Halte)
* **Profil:** 38 tahun, pemilik warung makan/kios di koridor transit.
* **Tujuan:** Mengetahui potensi keramaian pembeli pejalan kaki dan dampak perpindahan lalu lintas pembeli jika halte dipindah.
* **Kebutuhan:** Skor potensi ekonomi UMKM, visualisasi kluster usaha informal, dan ruang bersuara dalam musyawarah skenario.

---

## 4. Ruang Lingkup Produk (Scope Boundaries)

### In-Scope
1. **Simulasi Skenario Halte:** Penambahan halte baru, pemindahan halte eksisting, dan penutupan sementara.
2. **Kalkulasi Deterministik 3 Skor:**
   * Akses Jalan Kaki ($S_{\text{walk}}$) via OSRM Isochrone 5 & 10 menit + Kepadatan Penduduk.
   * Ekonomi UMKM ($S_{\text{umkm}}$) via densitas transaksi Struk Go + proporsi pedagang Menu Go.
   * Kelayakan Lokasi via persimpangan Zonasi RDTR 2022 Jakarta Satu + polygon risiko banjir InaRISK.
3. **Fitur Generatif & Penalaran Cerdas (Maps That Think):**
   * **AI Urban Council (Musyawarah Multi-Agent):** Simulasi perspektif Rina (Warga), Siti (UMKM), dan Andi (Dishub) lengkap dengan *Social Acceptance Rate (0–100%)*.
   * **Inverse Spatial Exploration:** Algoritma sampling koridor + pemeringkatan multi-objektif oleh AI untuk merekomendasikan 3 titik halte optimal.
   * **Predictive Behavioral Ripple Effect:** Estimasi persentase pergeseran moda pejalan kaki ke ojek online dan proyeksi dampak terhadap PKL.
   * **One-Click Policy Brief Generator:** Dokumen naskah advokasi formal berstruktur bab hukum, teknis, dan mitigasi.
4. **Peta Interaktif WebGIS (MapLibre GL):** Layer kontrol dinamis, render poligon isochrone, toggle layer zonasi/banjir/demografi, dan pin marker interaktif.
5. **Model Context Protocol (MCP) Server:** Endpoint SSE & JSON-RPC untuk discovery dan eksekusi tools spasial oleh AI Agent internal maupun eksternal.
6. **Perbandingan Skenario Side-by-Side & Export PDF/PNG.**
7. **Autentikasi Pengguna:** JWT email/password.

### Non-Goals (Out-of-Scope)
* **Pemodelan Utilitas Pipa & Kelistrikan:** Jaringan air dan grid daya tidak dimodelkan.
* **Panduan Perizinan Usaha Formal (OSS/NIB):** Pengurusan legalitas usaha mikro tidak masuk dalam cakupan produk.
* **Moda di Luar TransJakarta:** KRL/MRT hanya diposisikan sebagai simpul transit point, bukan rute yang dianalisis perubahan koridorya.
* **Live GPS Armada Bus:** Pelacakan armada bus seketika (*real-time fleet tracking*) di luar cakupan data statis kompetisi.

---

## 5. Arsitektur Teknologi & Spesifikasi AI/MCP

### 5.1 Diagram Arsitektur Sistem

```
                               ┌──────────────────────────────────────────────┐
                               │           Next.js 16 WebGIS Frontend         │
                               │   (MapLibre GL + Tailwind CSS v4 + React 19) │
                               └──────────────────────┬───────────────────────┘
                                                      │ HTTP / REST / SSE
                                                      ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                       LokaMaya Backend Core (Go 1.23)                                  │
 │                                                                                                        │
 │  ┌─────────────────────────────────┐                 ┌──────────────────────────────────────────────┐  │
 │  │        REST API Controllers     │                 │             LokaMaya MCP Server              │  │
 │  │    (Router Chi v5, Auth JWT)    │                 │       (JSON-RPC over HTTP-SSE / Stdio)       │  │
 │  └────────────────┬────────────────┘                 └──────────────────────┬───────────────────────┘  │
 │                   │                                                         │                          │
 │                   ▼                                                         ▼                          │
 │  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
 │  │                                    Analysis & Spatial Service                                    │  │
 │  │   - Walk Accessibility Engine (OSRM Isochrone + Population Density)                              │  │
 │  │   - UMKM Economic Scoring (Struk Go Density + Menu Go Weighting)                                 │  │
 │  │   - Location Feasibility Evaluator (RDTR 2022 Polygons + Flood Hazard Zones)                     │  │
 │  │   - Route Connectivity Analyzer (GTFS Interruption Check)                                        │  │
 │  │   - Corridor Point Sampler (Batch Spatial Simulation via Goroutines)                             │  │
 │  └───────────────┬───────────────────────────────┬──────────────────────────────┬───────────────────┘  │
 └──────────────────┼───────────────────────────────┼──────────────────────────────┼──────────────────────┘
                    │                               │                              │
                    ▼                               ▼                              ▼
     ┌─────────────────────────────┐  ┌───────────────────────────┐  ┌─────────────────────────────┐
     │  PostgreSQL 16 + PostGIS    │  │       OSRM Engine         │  │   Python AI Microservice    │
     │  + pgvector (Port 5432)     │  │ (Foot Routing, Port 5000) │  │       (FastAPI, Port 8001)      │
     │  - Spasial: Halte, Rute,    │  └───────────────────────────┘  │  - IndoBERT Classifier      │
     │    Zonasi, Banjir, Survei   │                                 │  - BGE-M3 Embedder (RAG)    │
     │  - Vektor: Dokumen Regulasi │                                 └─────────────────────────────┘
     └──────────────┬──────────────┘
                    │
                    ▼
     ┌─────────────────────────────┐
     │   Redis 7 Cache (Port 6379) │
     └─────────────────────────────┘

                                                ▲
                                                │ Tool Call Invocations
                                                │ (MCP Protocol / OpenAI Schema)
                                                ▼
                               ┌──────────────────────────────────┐
                               │      LiteLLM AI Gateway Proxy    │
                               │           (Port 4000)            │
                               └────────────────┬─────────────────┘
                                                │ HTTPS (Structured JSON)
                                                ▼
                               ┌──────────────────────────────────┐
                               │   Google Gemini 1.5 Flash Model  │
                               │  - Agentic Spatial Orchestrator  │
                               │  - Multi-Agent Deliberation      │
                               │  - Inverse Pareto Selection      │
                               └──────────────────────────────────┘
```

### 5.2 Model Context Protocol (MCP) Tools Registry

LokaMaya mengimplementasikan endpoint MCP Server di `/mcp/sse` yang mengekspos kumpulan tools berikut:

| Tool Name | Kategori | Input Parameter | Output Data |
|---|---|---|---|
| **`simulate_stop`** | Deterministik | `lat`, `lng`, `scenario_type`, `stop_name` | Skor $S_{\text{walk}}$, $S_{\text{umkm}}$, status kelayakan RDTR, risiko banjir, rute terganggu, poligon GeoJSON isochrone. |
| **`deliberate_stakeholders`** | Generatif Multi-Agent | `simulation_id` | Argumen Rina (Warga), argumen Siti (UMKM), argumen Andi (Dishub), skor konsensus sosial ($0–100\%$), rekomendasi mitigasi kompromi. |
| **`find_optimal_stops`** | Eksploratif Otonom | `corridor_name` / `center_lat`, `center_lng`, `radius_m`, `priority` | 3 kandidat titik halte terbaik (koordinat, skor per aspek, dan alasan pemilihan Pareto). |
| **`query_area_insight`** | Deterministik + RAG | `lat`, `lng`, `radius_m` | Catatan kualitatif survei lapangan (20+ titik) dan aspirasi warga Community Maps terdekat. |
| **`explain_score`** | Penjelasan | `score_type` | Komponen rumus, bobot, dan metodologi penilaian. |
| **`generate_policy_brief`** | Generatif Dokumen | `simulation_id`, `target_agency` | Teks terstruktur naskah advokasi kebijakan (Dasar Hukum RDTR, Analisis Dampak, Rekomendasi). |

---

## 6. Metodologi Analisis Spasial Deterministik

### 6.1 Skor Akses Jalan Kaki ($S_{\text{walk}}$) — Rentang 0 s.d. 100
$$S_{\text{walk}} = 0.6 \cdot \left( \frac{\text{Pop}_{\text{isochrone 10m}}}{\text{Pop}_{\text{target kelurahan}}} \times 100 \right) + 0.4 \cdot \left( \frac{\text{Area}_{\text{OSRM isochrone}}}{\pi \cdot R_{\text{walk}}^2} \times 100 \right)$$
* Jangkauan pejalan kaki dihitung oleh **OSRM** berdasarkan jaringan jalan riil (*street network*), bukan garis lurus.

### 6.2 Skor Ekonomi UMKM ($S_{\text{umkm}}$) — Rentang 0 s.d. 100
$$S_{\text{umkm}} = 0.5 \cdot \min\left(100, \frac{N_{\text{struk 300m}}}{T_{\text{struk}}} \times 100\right) + 0.5 \cdot \left( \frac{N_{\text{informal menu}}}{N_{\text{total usaha}}} \times 100 \right)$$
* $N_{\text{struk}}$: Volume transaksi lokal dari dataset **Struk Go** dalam radius 300m.
* $N_{\text{informal}}$: Keberadaan warung/pedagang kecil dari dataset **Menu Go**.

### 6.3 Evaluasi Kelayakan Lokasi (RDTR 2022 & Banjir)
* **Zonasi RDTR 2022:**
  * *Sesuai:* Zona Transportasi (TR), Zona Perkantoran/Komersial (K), Zona Campuran (C).
  * *Bersyarat:* Zona Perumahan Kepadatan Tinggi (R), Ruang Terbuka Hijau Tertentu (H).
  * *Tidak Sesuai:* Zona Lindung Ketat, Jalur SUTET, Badan Air.
* **Risiko Banjir:**
  * Kategori Rendah ($<20\text{ cm}$), Sedang ($21–50\text{ cm}$), Tinggi ($>50\text{ cm}$). Jika risiko tinggi, status kelayakan diturunkan satu level dengan rekomendasi elevasi struktur halte.

---

## 7. Desain Fitur Generatif & Penalaran Cerdas (Maps That Think)

### 7.1 Fitur 1: Simulasi Musyawarah Multi-Agent (AI Urban Council)
* **Mekanisme:** Setelah simulasi deterministik menghasilkan skor di titik $(x, y)$, AI mengeksekusi *multi-persona reasoning*:
  * **Agen Warga (Rina):** Mengevaluasi kenyamanan rute jalan kaki, pencahayaan malam, dan keamanan menyeberang jalan.
  * **Agen UMKM (Siti):** Mengevaluasi apakah pergeseran halte mematikan pembeli langganan atau mengalirkan arus pejalan kaki baru ke lapak.
  * **Agen Dishub (Andi):** Mengevaluasi kesesuaian jalur bus TransJakarta, kemudahan manuver armada, dan kepatuhan zonasi RDTR.
* **Output:** Kartu interaktif di panel hasil:
  * Quote sentimen dari masing-masing agen.
  * Meteran **"Social Acceptance Rate"** ($0–100\%$).
  * Poin kompromi jalan tengah (misal: *"Halte disetujui pindah dengan syarat penambahan zebra cross berlampu dan relokasi teratur bagi 5 kios kaki lima ke kantong transit"*).

### 7.2 Fitur 2: Pencarian Titik Optimal Otonom (Inverse Spatial Exploration)
* **Mekanisme:**
  1. Pengguna memilih nama koridor jalan (misal: "Jl. Gatot Subroto") atau menggambar bounding area di peta.
  2. Backend Go men-generate 6–10 titik sampel sepanjang koridor dengan jarak interval 150 meter.
  3. Goroutine Go menjalankan `RunSimulation` secara paralel untuk seluruh titik sampel dalam $< 1.5\text{ detik}$.
  4. AI Agent (Gemini 1.5 Flash) mengevaluasi matriks hasil dan menyaring **Top 3 Titik Pareto-Optimal**:
     * **Rekomendasi 1 (Pilihan Warga):** Titik dengan jangkauan pejalan kaki tertinggi.
     * **Rekomendasi 2 (Pilihan Ekonomi):** Titik dengan konsentrasi UMKM tertinggi.
     * **Rekomendasi 3 (Pilihan Paling Aman/Resilien):** Titik dengan kepatuhan zonasi terbaik dan risiko banjir terendah.
  5. Peta otomatis meletakkan 3 pin marker berkode warna emas/perak/perunggu dengan tag rekomendasi.

### 7.3 Fitur 3: Prediksi Efek Domino Perilaku (Behavioral Shift)
* Berdasarkan skor akses jalan kaki dan kontur jaringan jalan, AI memproyeksikan:
  * Estimasi pergeseran moda: *"Perpindahan halte sejauh 350m diprediksi menyebabkan pergeseran $\approx 22\%$ penumpang beralih ke ojek online pada perjalanan first/last-mile."*
  * Dinamika ekonomi mikro: *"Area sekitar titik lama diprediksi mengalami penurunan omset UMKM makanan ringan $\approx 30\%$, sedangkan titik baru berpotensi memunculkan simpul pedagang baru dalam kurun 1–2 bulan."*

### 7.4 Fitur 4: One-Click Policy Brief Generator
* AI memformat seluruh hasil simulasi, kutipan hukum RDTR (via RAG pgvector), ringkasan musyawarah multi-agent, dan peta isochrone menjadi naskah formal standar Pemprov DKI (format Markdown/PDF).

---

## 8. User Stories & Acceptance Criteria

### US-001: Simulasi Interaktif via Pin Peta
**Deskripsi:** Sebagai pengguna (Rina / Andi), saya ingin mengklik titik manapun di peta Jakarta untuk langsung mensimulasikan penambahan atau pemindahan halte agar saya dapat melihat dampaknya secara instan.  
**Acceptance Criteria:**
- [ ] Pengguna dapat mengklik peta untuk memunculkan context popup dan tombol "Simulasikan di Sini".
- [ ] Pengguna dapat memilih skenario: `tambah`, `pindah`, atau `tutup`.
- [ ] Sistem memunculkan poligon isochrone 5 dan 10 menit jalan kaki di atas peta.
- [ ] Panel hasil menampilkan 3 skor kuantitatif ($S_{\text{walk}}$, $S_{\text{umkm}}$, Status Kelayakan).
- [ ] **[UI]** Verify in browser using dev-browser skill.

### US-002: Orkestrasi Simulasi Otonom via AI Chatbot (MCP Tool Calling)
**Deskripsi:** Sebagai pengguna, saya ingin mengajukan pertanyaan dalam bahasa Indonesia natural di chatbot sehingga AI secara otomatis memanggil tool simulasi dan menjelaskan hasilnya.  
**Acceptance Criteria:**
- [ ] AI Agent mengenali intensi simulasi dan mengekstrak entitas lokasi/koordinat serta skenario.
- [ ] AI Agent mengeksekusi MCP tool `simulate_stop` dengan parameter koordinat valid.
- [ ] AI menyusun penjelasan naratif yang memadukan 3 skor deterministik dan konteks kualitatif lapangan tanpa mengubah angka skor asli.
- [ ] Peta otomatis mengarahkan kamera (*pan/fly-to*) ke titik yang sedang disimulasikan oleh AI.
- [ ] **[UI]** Verify in browser using dev-browser skill.

### US-003: Visualisasi Multi-Layer Spasial Dinamis
**Deskripsi:** Sebagai perencana transportasi (Andi), saya ingin mengaktifkan dan menonaktifkan layer transit, zonasi tata ruang, dan kepadatan penduduk agar saya dapat memahami konteks spasial di sekitar kandidat halte.  
**Acceptance Criteria:**
- [ ] Tersedia kontrol toggle layer: Halte Eksisting, Rute Koridor TransJakarta, Isochrone Jalan Kaki, Zonasi RDTR 2022, dan Peta Kepadatan Penduduk.
- [ ] Layer RDTR menampilkan legenda warna zonasi yang informatif.
- [ ] Toggle layer bekerja secara reaktif tanpa re-render peta keseluruhan.
- [ ] **[UI]** Verify in browser using dev-browser skill.

### US-004: Musyawarah Multi-Agent (AI Urban Council Deliberation)
**Deskripsi:** Sebagai pengguna atau analis, saya ingin melihat simulasi pandangan 3 pemangku kepentingan (Warga, UMKM, Dishub) terhadap titik halte terpilih agar saya dapat mengantisipasi resistensi sosial.  
**Acceptance Criteria:**
- [ ] Tersedia tab/kartu "Musyawarah AI (Urban Council)" pada panel hasil simulasi.
- [ ] Sistem menampilkan kutipan sikap dan argumentasi dari Agen Rina (Warga), Agen Siti (UMKM), dan Agen Andi (Dishub).
- [ ] Menampilkan indikator angka *Social Acceptance Rate (0–100%)*.
- [ ] Menyajikan ringkasan solusi kompromi yang menyeimbangkan kepentingan ketiga pihak.
- [ ] **[UI]** Verify in browser using dev-browser skill.

### US-005: Pencarian Titik Halte Optimal Otonom (Inverse Spatial Search)
**Deskripsi:** Sebagai perencana (Andi), saya ingin meminta AI mencarikan 3 titik halte terbaik di sepanjang koridor jalan tertentu agar saya tidak perlu mencoba koordinat satu per satu.  
**Acceptance Criteria:**
- [ ] Pengguna dapat mengetik perintah pencarian koridor (misal: *"Carikan 3 titik halte terbaik di Jl. Gatot Subroto"*).
- [ ] AI mengeksekusi tool `find_optimal_stops` dan memicu batch simulation secara paralel di backend.
- [ ] Peta menampilkan 3 pin marker rekomendasi dengan label: Terbaik untuk Warga, Terbaik untuk UMKM, dan Terbaik Kepatuhan Regulasi.
- [ ] Pengguna dapat mengklik salah satu pin rekomendasi untuk melihat rincian skor lengkapnya.
- [ ] **[UI]** Verify in browser using dev-browser skill.

### US-006: Prediksi Efek Domino Perilaku (Behavioral Ripple Effect)
**Deskripsi:** Sebagai perencana transportasi, saya ingin mendapatkan estimasi dampak lanjutan terhadap perubahan perilaku komuter dan relokasi pedagang informal.  
**Acceptance Criteria:**
- [ ] Panel analisis memuat bagian "Prediksi Perilaku & Dampak Lanjutan".
- [ ] Menyajikan estimasi persentase pergeseran moda pejalan kaki ke moda alternatif (ojek online).
- [ ] Menyajikan catatan potensi dampak terhadap kelangsungan usaha mikro informal sekitar.

### US-007: Perbandingan Skenario Side-by-Side
**Deskripsi:** Sebagai pengguna, saya ingin membandingkan dua skenario halte secara berdampingan di satu layar agar dapat memilih opsi terbaik secara objektif.  
**Acceptance Criteria:**
- [ ] Pengguna dapat memilih minimal 2 hasil simulasi untuk dibandingkan berdampingan.
- [ ] Layar perbandingan menampilkan metrik berdampingan dengan delta perbandingan ($\Delta$).
- [ ] AI Agent menghasilkan narasi komparatif trade-off otomatis.
- [ ] Peta menampilkan overlay visual perbandingan kedua isochrone dengan warna berbeda.
- [ ] **[UI]** Verify in browser using dev-browser skill.

### US-008: Pembuatan Naskah Advokasi Kebijakan (One-Click Policy Brief)
**Deskripsi:** Sebagai warga (Rina) atau perencana (Andi), saya ingin mengekspor naskah kebijakan formal siap pakai berbasis hasil simulasi untuk diserahkan ke instansi pemerintah.  
**Acceptance Criteria:**
- [ ] Terdapat tombol "Buat Naskah Kebijakan (Policy Brief)" pada panel hasil.
- [ ] Dokumen memuat: Dasar Hukum Zonasi RDTR, Matriks Skor Kuantitatif, Hasil Musyawarah Multi-Agent, dan Rencana Mitigasi Rekayasa.
- [ ] Pengguna dapat mengunduh naskah dalam format PDF atau menyalin teks Markdown yang rapi.

### US-009: Standar Konektivitas Eksternal via MCP Server Endpoint
**Deskripsi:** Sebagai developer eksternal / pengguna Claude Desktop, saya ingin menghubungkan LLM eksternal ke MCP Server LokaMaya.  
**Acceptance Criteria:**
- [ ] Backend mengekspos endpoint MCP SSE di `/mcp/sse`.
- [ ] Response mematuhi standar JSON-RPC 2.0 Anthropic MCP Protocol.
- [ ] Request `tools/list` mengembalikan daftar tool resmi (`simulate_stop`, `deliberate_stakeholders`, `find_optimal_stops`, `query_area_insight`).

---

## 9. Persyaratan Fungsional (Functional Requirements)

* **FR-1:** Sistem harus memuat basemap vektor interaktif EPSG:4326/EPSG:3857 menggunakan MapLibre GL.
* **FR-2:** Sistem harus merender layer transit (halte dan rute TransJakarta) dari PostGIS sebagai vector GeoJSON.
* **FR-3:** Sistem harus mengizinkan pemilihan koordinat via klik peta atau teks koordinat.
* **FR-4:** Sistem harus memproses kalkulasi jaringan isochrone 5 dan 10 menit jalan kaki via OSRM internal.
* **FR-5:** Sistem harus menghitung skor akses jalan kaki ($S_{\text{walk}}$) menggunakan persimpangan spasial PostGIS (`ST_Intersects`) dengan data kependudukan.
* **FR-6:** Sistem harus menghitung skor ekonomi UMKM ($S_{\text{umkm}}$) berdasarkan densitas Struk Go dan bobot Menu Go dalam radius 300 meter.
* **FR-7:** Sistem harus memeriksa status zonasi RDTR 2022 pada koordinat halte melalui kueri `ST_Contains`.
* **FR-8:** Sistem harus memeriksa kerentanan genangan banjir terhadap layer polygon InaRISK / BPBD DKI.
* **FR-9:** Backend Go harus mengekspos endpoint MCP Server dengan protokol Server-Sent Events (SSE) dan JSON-RPC 2.0.
* **FR-10:** AI Orchestrator harus memetakan pertanyaan natural language ke dalam skema tool MCP terkait.
* **FR-11:** AI Gateway (LiteLLM) harus meneruskan request penyusunan narasi ke Google Gemini 1.5 Flash menggunakan API key yang terkonfigurasi.
* **FR-12:** Jika terjadi kegagalan koneksi ke LLM, sistem harus otomatis beralih ke rule-based fallback tanpa menggagalkan hasil komputasi spasial.
* **FR-13:** Sistem harus menyediakan fungsi batch spatial calculation menggunakan Go goroutines untuk mendukung fitur pencarian titik optimal koridor.
* **FR-14:** AI Agent harus menghasilkan output terstruktur JSON untuk simulasi musyawarah multi-agent yang memuat kutipan 3 persona dan nilai *Social Acceptance Rate*.
* **FR-15:** Sistem harus menyimpan setiap simulasi ke dalam tabel `simulation_runs` di PostgreSQL.
* **FR-16:** Sistem harus memvalidasi token JWT pada endpoint terproteksi (`/api/v1/analysis/*`).
* **FR-17:** Microservice AI Python (FastAPI) harus menyediakan endpoint `/embed` (BGE-M3) dan `/classify` (IndoBERT) untuk pengolahan teks regulasi dan aspirasi warga.
* **FR-18:** Hasil kueri spasial dan isochrone yang identik harus disimpan pada cache Redis dengan TTL minimal 3600 detik.
* **FR-19:** Sistem harus menghasilkan dokumen export berformat PDF/PNG yang merangkum hasil simulasi dan naskah advokasi.

---

## 10. Matriks Risiko & Rencana Mitigasi

| Kategori Risiko | Potensi Dampak | Tingkat Risiko | Strategi Mitigasi Teknis |
|---|---|---|---|
| **Latency Inferensi Multi-Agent** | Waktu respons chatbot terasa lambat jika menjalankan deliberasi 3 persona berturut-turut. | Sedang | Gunakan **Single-Turn Structured Prompting** ke Gemini 1.5 Flash. Dalam satu request, model menghasilkan respons terstruktur JSON yang memuat dialog ketiga persona sekaligus dalam $< 2.5\text{ detik}$. |
| **Beban Komputasi Batch Titik Koridor** | Server lambat saat menghitung 6–10 titik sampel secara simultan. | Sedang | Eksekusi kalkulasi spasial menggunakan **Worker Pool / Goroutines Go** secara non-blocking dan caching hasil isochrone ke Redis. Batasi sampling maksimal 8 titik per request. |
| **Halusinasi Angka Skor oleh AI** | AI menyebutkan angka skor yang tidak sesuai dengan database. | Tinggi | **Strict Parameter Grounding:** AI tidak memiliki izin menghitung skor. Angka skor disuntikkan sebagai *Tool Result* ke context window LLM, dan system prompt mengunci aturan bahwa angka tidak boleh diubah. |
| **Keterbatasan Kuota Google AI Studio** | Token rate limit tercapai saat demo pengujian. | Rendah | Mengaktifkan caching response di LiteLLM (Redis cache TTL 1 jam) dan menyediakan fallback heuristik deterministik jika kuota limit tercapai. |

---

## 11. Rencana Deployment & Prasyarat Sistem

* **Containerization:** Terorkestrasi melalui `docker-compose.yml`:
  * `web`: Next.js 16 App Router (Port 3000)
  * `api`: Golang Chi REST API + MCP Server (Port 8080)
  * `ai-service`: FastAPI + PyTorch IndoBERT + BGE-M3 (Port 8001)
  * `litellm`: LiteLLM Proxy Gateway (Port 4000)
  * `postgres`: PostgreSQL 16 + PostGIS + pgvector (Port 5432)
  * `redis`: Redis 7 Alpine (Port 6379)
  * `osrm`: OSRM Backend Foot Routing Engine (Port 5000)
* **Kredensial Environment (`.env`):**
  * `GOOGLE_AI_STUDIO_API_KEY`: Kunci API aktif Google AI Studio.
  * `NEXT_PUBLIC_MAPID_API_KEY`: Lisensi token MAPID SDK.
  * `JWT_SECRET`: Token secret minimum 32 karakter.
