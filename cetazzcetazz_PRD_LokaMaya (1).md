## MAPID WEBGIS COMPETITION #2 - 2026

Maps That Think! - Mass Transportation Edition

## PRODUCT REQUIREMENT DOCUMENT (PRD)

WebGIS - Spatial Intelligence untuk Transportasi Massal

| Nama Tim | cetazz cetazz |
| --- | --- |
| Judul Proyek | LokaMaya |
| Institusi | Institut Teknologi Bandung |
| Ketua Tim | Stefany Josefina Santono |
| Kontak | stefanyjoaefina22@gmail.com / 082211295222 |

## Anggota Tim

| No. Nama Lengkap |   | Peran dalam Tim |
| --- | --- | --- |
| 1 | Stefany Josefina Santono | Project Leader |
| 2 | Aulia Azka Azzahra | UI/UX Designer |
| 3 | Dita Maheswari | WebGIS Developer |
| 4 | Theresia Ivana Marella Siswahyudi | Business / Product Analyst |
| 5 | Ahmad Syafiq | Data & AI Analyst |


## 1. Ringkasan Eksekutif

LokaMaya merupakan WebGIS interaktif yang dikembangkan untuk mensimulasikan dampak perubahan halte, baik penambahan, pemindahan, maupun penutupan sementara. Melalui peta dan chatbot, pengguna dapat melihat bagaimana perubahan halte memengaruhi akses masyarakat, aktivitas UMKM, serta kelayakan lokasi. LokaMaya hadir untuk menjawab permasalahan belum tersedianya media yang mudah digunakan untuk menilai dampak perubahan halte secara menyeluruh dan berbasis data.

## Dataset yang digunakan terdiri dari:

- Community Maps, Struk Go, dan Menu Go sebagai dataset utama dari MAPID.

- Rute TransJakarta dan jaringan jalan OpenStreetMap untuk informasi transportasi dan aksesibilitas.

- Data penduduk, peta rawan banjir, dan data tata ruang DKI Jakarta sebagai data pendukung analisis.

Data tersebut dilengkapi dengan Survey Activities pada lebih dari 20 titik untuk memperoleh gambaran kondisi lapangan secara langsung. Survei mencakup kondisi akses pejalan kaki, konektivitas transportasi lokal, UMKM informal, serta kondisi drainase dan genangan. Hasil survei digunakan untuk memvalidasi dan melengkapi data yang tersedia pada sistem.

Analisis spasial dilakukan pada tiga aspek utama:

- Aksesibilitas pejalan kaki, untuk melihat jangkauan masyarakat menuju halte berdasarkan jaringan jalan.

- Dampak ekonomi UMKM, untuk melihat potensi aktivitas ekonomi di sekitar halte.

- Kelayakan lokasi, dengan mempertimbangkan kesesuaian tata ruang dan risiko banjir.

Dalam solusi ini, AI berperan sebagai penghubung antara pengguna dan sistem. AI memahami pertanyaan pengguna, menerjemahkannya menjadi perintah yang dapat dijalankan sistem, serta membantu menjelaskan hasil analisis dengan bahasa yang mudah dipahami. Perhitungan spasial tetap dilakukan oleh sistem komputer agar hasilnya konsisten dan dapat ditelusuri.

Hasil utama LokaMaya meliputi peta interaktif, skor aksesibilitas, skor dampak ekonomi UMKM, status kelayakan lokasi, serta ringkasan hasil simulasi. Hasil tersebut dapat digunakan untuk membandingkan beberapa skenario perubahan halte dan menjadi bahan pendukung bagi masyarakat maupun pengambil kebijakan dalam menentukan lokasi halte yang lebih tepat.

## 2. Tujuan Produk

## Problem Statement

Saat ini, keputusan terkait penambahan, pemindahan, atau penutupan halte belum selalu mempertimbangkan kondisi akses pejalan kaki, aktivitas UMKM di sekitar halte, serta risiko dan kesesuaian lokasi secara bersamaan. Di sisi lain, masyarakat juga belum memiliki media yang mudah digunakan untuk melihat dan membuktikan dampak perubahan halte berdasarkan data.

Masalah ini berdampak pada beberapa pihak, yaitu:

- Masyarakat dan penumpang, yang dapat mengalami perubahan akses dan jarak menuju halte.

- Pelaku UMKM, yang aktivitas ekonominya dapat terdampak oleh perubahan arus pejalan kaki.


- Pengambil kebijakan, yang membutuhkan informasi pendukung untuk menentukan lokasi halte yang lebih tepat.

Dampaknya, perubahan lokasi halte berpotensi membuat akses sebagian masyarakat menjadi kurang optimal, mengubah aktivitas ekonomi di sekitar halte, serta menimbulkan risiko apabila lokasi baru tidak sesuai dengan kondisi lingkungan atau tata ruang.

WebGIS diperlukan karena permasalahan tersebut memiliki aspek lokasi yang kuat. Dengan menggabungkan berbagai data spasial dan kondisi lapangan dalam satu peta interaktif, dampak dari setiap skenario perubahan halte dapat dilihat dan dibandingkan secara lebih mudah.

## Tujuan

Tujuan utama LokaMaya adalah menyediakan media berbasis WebGIS untuk membantu pengguna memahami dan membandingkan dampak dari berbagai skenario perubahan halte sebelum keputusan diterapkan.

Melalui LokaMaya, pengguna diharapkan memperoleh:

- Informasi mengenai perubahan jangkauan akses pejalan kaki.

- Gambaran potensi dampak terhadap UMKM di sekitar halte.

- Informasi mengenai kesesuaian tata ruang dan risiko banjir pada lokasi yang disimulasikan.

- Hasil perbandingan beberapa skenario dalam bentuk peta, skor, dan penjelasan yang mudah dipahami.

Dengan adanya informasi tersebut, LokaMaya diharapkan dapat membantu masyarakat menyampaikan aspirasi berdasarkan data, membantu UMKM memahami potensi perubahan aktivitas di sekitar lokasi usaha, serta mendukung pengambilan keputusan terkait penentuan lokasi halte.

## Value Proposition

## Pengguna utama

- Warga dan penumpang transit: membutuhkan informasi mengenai kemudahan akses menuju halte.

- Pelaku UMKM: membutuhkan gambaran mengenai potensi perubahan aktivitas ekonomi di sekitar lokasi usaha.

- Pengambil kebijakan: membutuhkan data spasial yang dapat mendukung evaluasi dan perbandingan lokasi halte.

Nilai yang ditawarkan LokaMaya adalah menggabungkan WebGIS, data lapangan, analisis spasial, dan AI dalam satu solusi. Pengguna dapat memilih lokasi atau bertanya melalui chatbot untuk menjalankan simulasi, kemudian melihat hasil analisis secara langsung pada peta.

Keunggulan LokaMaya meliputi:

- WebGIS: menggabungkan berbagai informasi berbasis lokasi dalam satu tampilan interaktif.

- Survey Activities: memberikan validasi kondisi nyata di lapangan dan melengkapi data yang tersedia.

- Analisis spasial: mengukur aksesibilitas, potensi ekonomi UMKM, serta kelayakan lokasi secara terukur.


- AI: memudahkan pengguna berinteraksi dengan sistem dan memahami hasil analisis tanpa harus memiliki kemampuan teknis.

Dengan pendekatan tersebut, LokaMaya tidak hanya menampilkan data pada peta, tetapi membantu pengguna memahami dampak, membandingkan pilihan, dan mengambil keputusan berdasarkan kondisi wilayah yang sebenarnya.

## 3. Ruang Lingkup Produk

## In-Scope

- Simulasi skenario perubahan halte (tambah, pindah, tutup sementara) dengan tiga skor utama: Akses Jalan Kaki, Ekonomi UMKM, dan Kelayakan Lokasi (kesesuaian tata ruang RDTR + risiko banjir).

- Peta interaktif berbasis MAPID MAPS SDK dengan layer Transit (Halte Existing, Rute Koridor, Isochrone 5–10 menit jalan kaki) dan interaksi klik-titik-untuk-simulasi.

- Layer pendukung Zonasi (Land Use RDTR, Batas Ketinggian) dan Demografi (Kepadatan Penduduk) sebagai toggle visual di peta. Data tersebut menjadi input untuk skor Kelayakan Lokasi dan Akses Jalan Kaki, bukan dashboard analisis mandiri.

- Antarmuka chatbot AI yang menerjemahkan pertanyaan natural language menjadi perintah simulasi (lokasi, radius) dan menjelaskan hasil skor, bukan menghitung angka.

- Card "Analisis AI" yang menggabungkan skor kuantitatif dengan konteks kualitatif dari data Survey Activities (deskripsi kondisi lapangan per titik, dikumpulkan sebelum pengembangan WebGIS dimulai) menjadi satu narasi penjelasan yang koheren.

- Fitur Perbandingan Skenario (side-by-side, minimal 2 skenario) lengkap dengan narasi komparatif otomatis dari AI.

- Export ringkasan hasil simulasi (PDF/gambar) sebagai bukti data pendukung aspirasi warga ke pemerintah.

- Integrasi dataset dasar MAPID (Community Maps, Struk Go, Menu Go) serta data pendukung (GTFS TransJakarta, OSM, RDTR 2022, peta rawan banjir/InaRISK).

- Panel hasil (slide-over) dengan rincian tiap skor yang bisa diklik untuk melihat komponen penilaian.

- Autentikasi dasar (login) untuk mengakses fitur simulasi.

## Out-of-Scope

- Modul dashboard analisis mandiri Infrastruktur & Utilitas (Jaringan Air, Power Grid) dan Logistik & Ekonomi (Commercial Heatmap, Warehouse Locations) tidak memiliki dasar data, perhitungan, maupun kebutuhan pengguna dalam proposal maupun ketiga user persona, sehingga dikeluarkan sepenuhnya, bukan sekadar ditunda.

- Panduan izin usaha UMKM (explain_permit_steps, RAG KBLI/OSS/NIB) sempat dipertimbangkan pada tahap proposal, tetapi dikeluarkan karena tidak tercermin dalam goals maupun kebutuhan utama ketiga persona, termasuk persona UMKM/Siti. Fitur ini tidak menjawab kebutuhan pengguna yang telah tervalidasi.

- Skema atribut survey terstruktur sesuai rancangan awal proposal (kategori tetap: kondisi fisik akses pejalan kaki, konektivitas first/last-mile, data UMKM informal, risiko lingkungan/drainase mikro) tidak digunakan karena data lapangan yang terkumpul bersifat deskriptif bebas. Data tersebut difungsikan sebagai konteks kualitatif untuk AI, bukan sebagai input otomatis ke formula skor terstruktur.


- Role-based access control (admin/warga/instansi) dikeluarkan karena kebutuhan produk cukup dipenuhi dengan autentikasi dasar tanpa pembedaan peran.

- Mode transportasi selain TransJakarta (MRT, LRT, angkot, Mikrotrans) berada di luar cakupan kompetisi saat ini dan menjadi arah pengembangan lanjutan.

- Fitur premium berbayar untuk instansi/konsultan merupakan bagian dari model bisnis jangka panjang dan bukan deliverable pengembangan produk.

- Replikasi ke kota lain (Bandung, Semarang, Surabaya) merupakan potensi skalabilitas dan bukan target kompetisi.

- Integrasi data real-time, seperti live GPS armada bus, berada di luar cakupan karena dataset yang tersedia dari MAPID dan sumber resmi bersifat statis atau periodik.

## 3. User Persona

## Persona 1 - Warga / Pengguna Transportasi Umum

- Nama: Rina

- Jabatan: Warga setempat / Pengguna transportasi umum

- Usia: 29 tahun

- Latar Belakang: Pengguna transportasi umum yang sehari-hari menggunakan halte untuk bekerja dan beraktivitas. Praktis, terbiasa menggunakan teknologi digital, dan peduli terhadap kondisi lingkungan sekitar.

- Goals: Mengetahui perubahan jangkauan jalan kaki dari halte, membandingkan lokasi halte lama dengan lokasi halte alternatif, mengetahui perubahan konektivitas rute, serta mendapatkan data pendukung untuk menyampaikan aspirasi kepada pemerintah.

- Pain Points: Sulit mengetahui dampak pemindahan atau penambahan halte, tidak memiliki data untuk mendukung keluhan atau aspirasi, informasi transportasi dan kondisi wilayah tersebar di berbagai sumber, serta sulit mengetahui akses jalan kaki, risiko banjir, dan kesesuaian tata ruang lokasi baru.

- Needs: Informasi dampak perubahan halte yang mudah dipahami, peta jangkauan jalan kaki berdasarkan jaringan jalan sebenarnya, informasi konektivitas rute, informasi risiko banjir dan tata ruang, fitur simulasi dan perbandingan lokasi halte, serta penjelasan hasil analisis dengan bahasa sederhana.

- User Stories: Rina ingin mengetahui apakah perubahan lokasi halte akan membuat akses transportasi sehari-harinya menjadi lebih mudah atau lebih sulit. Ia membutuhkan informasi mengenai akses jalan kaki, konektivitas rute, dan kondisi lokasi agar dapat memahami dampak perubahan halte serta menyampaikan aspirasinya berdasarkan data.

## Persona 2 - Staf Perencana Transportasi Pemerintah Daerah

- Nama: Andi

- Jabatan: Staf Perencana Transportasi Pemerintah Daerah

- Usia: 41 tahun

- Latar Belakang: Terlibat dalam proses perencanaan dan evaluasi transportasi. Terbiasa menggunakan data dalam pengambilan keputusan dan mempertimbangkan kebutuhan masyarakat dalam perencanaan wilayah.

- Goals: Menentukan lokasi halte yang optimal, membandingkan beberapa skenario lokasi, mengetahui jumlah warga dan UMKM yang terdampak, mengetahui perubahan konektivitas rute, serta memastikan lokasi sesuai tata ruang dan mempertimbangkan risiko banjir.

- Pain Points: Data transportasi, kependudukan, UMKM, banjir, dan tata ruang berada di sumber yang berbeda, membutuhkan waktu untuk menggabungkan dan menganalisis data, sulit memprediksi dampak sebelum halte dipindah atau dibangun, sulit


- membandingkan beberapa alternatif lokasi secara objektif, serta aspirasi masyarakat sering belum disertai data pendukung.

- Needs: Data geospasial yang terintegrasi, simulasi perubahan halte yang cepat dan konsisten, analisis aksesibilitas, ekonomi UMKM, konektivitas rute, dan kelayakan lokasi, hasil analisis yang transparan dan dapat ditelusuri, perbandingan skenario yang mudah dipahami, serta visualisasi data untuk mendukung pengambilan keputusan.

- User Stories: Andi membutuhkan informasi yang terintegrasi untuk membandingkan beberapa alternatif lokasi halte. Ia ingin melihat dampak setiap skenario terhadap akses masyarakat, aktivitas ekonomi, konektivitas rute, serta kesesuaian dan kondisi lokasi agar keputusan yang diambil lebih terukur dan berbasis data.

## Persona 3 - Pelaku UMKM / Pemilik Usaha di Sekitar Halte

- Nama: Siti

- Jabatan: Pemilik UMKM / Warung makan sekitar halte

- Usia: 38 tahun

- Latar Belakang: Pelaku UMKM yang menjalankan usaha di sekitar halte dan bergantung pada aktivitas masyarakat serta pejalan kaki di sekitar lokasi. Praktis dan adaptif terhadap perubahan lingkungan sekitar.

- Goals: Mengetahui kondisi aktivitas ekonomi di sekitar halte, mengetahui potensi dampak perubahan akses pejalan kaki terhadap usaha, membandingkan potensi ekonomi beberapa lokasi halte, serta mendapatkan informasi mengenai perubahan wilayah secara lebih cepat.

- Pain Points: Tidak mengetahui dampak perubahan halte terhadap aktivitas ekonomi sekitar, informasi mengenai perubahan halte sulit diperoleh, data UMKM informal sering tidak tercatat dalam peta digital, sulit mengetahui tingkat aktivitas ekonomi di sekitar lokasi, serta tidak memiliki data untuk menyampaikan kekhawatiran kepada pemerintah.

- Needs: Informasi aktivitas ekonomi di sekitar halte, peta sebaran dan kepadatan UMKM, skor ekonomi UMKM yang mudah dipahami, informasi perubahan jangkauan jalan kaki, serta data yang dapat digunakan untuk mempersiapkan usaha dan menyampaikan aspirasi.

- User Stories: Siti ingin mengetahui bagaimana perubahan halte dapat memengaruhi aktivitas masyarakat dan potensi ekonomi di sekitar usahanya. Ia membutuhkan informasi mengenai aktivitas UMKM, jangkauan jalan kaki, dan perubahan lokasi agar dapat mempersiapkan usahanya serta menyampaikan kekhawatirannya berdasarkan data.

## 4. Dataset Dasar

## Dataset Dasar dari MAPID (Panitia)

| Dataset | Sumber | Fungsi dalam Produk |
| --- | --- | --- |
|   |   | Sinyal partisipasi dan aspirasi warga |
|   |   | per area (title, description, lat/long) |
|   |   | diklasifikasikan menggunakan |
|   |   | IndoBERT untuk memisahkan |
| Community Maps | MAPID (Community Maps) | aspirasi terkait transit dan pejalan |
|   |   | kaki dari noise. Hasil klasifikasi |
|   |   | digunakan sebagai konteks |
|   |   | tambahan untuk skor Akses Jalan |
|   |   | Kaki dan sebagai input dalam narasi |
|   |   | Analisis AI. |
|   |   | Indikator kepadatan aktivitas |
| Struk Go | MAPID (Struk Go) | ekonomi dan transaksi bisnis lokal |
|   |   | (nama tempat, kategori, waktu |


| Dataset | Sumber | Fungsi dalam Produk |
| --- | --- | --- |
|   |   | transaksi, metode pembayaran, |
|   |   | lat/long) digunakan sebagai |
|   |   | komponen utama dalam |
|   |   | perhitungan skor Ekonomi UMKM. |
|   |   | Proksi tingkat informalitas usaha dan |
|   |   | keramaian ekonomi (jenis tempat, |
|   |   | kondisi pembeli, mobilitas, harga, |
| Menu Go | MAPID (Menu Go) | lat/long) digunakan untuk |
|   |   | melengkapi skor Ekonomi UMKM, |
|   |   | khususnya dalam mengidentifikasi |
|   |   | usaha informal atau PKL yang tidak |
|   |   | tercatat pada peta digital umum. |

## Data Pendukung (Sumber Resmi Eksternal)

| Dataset | Sumber | Fungsi dalam Produk |
| --- | --- | --- |
|   |   | Data pembanding rute dan halte |
|   |   | eksisting digunakan sebagai |
| Rute TransJakarta (GTFS) | PPID TransJakarta | baseline untuk melihat perbedaan |
|   |   | kondisi eksisting dan proyeksi |
|   |   | sebelum dan sesudah simulasi. |
|   |   | Perhitungan jarak tempuh jalan kaki |
|   |   | menggunakan OSRM berdasarkan |
|   |   | jaringan jalan sebenarnya, bukan |
| Peta Jalan (OpenStreetMap) | OpenStreetMap | garis lurus, digunakan sebagai dasar |
|   |   | untuk menentukan isochrone 5 |
|   |   | sampai 10 menit dan menghitung |
|   |   | skor Akses Jalan Kaki. |
|   |   | Pengecekan kesesuaian lokasi halte |
|   |   | dengan aturan tata ruang digunakan |
| Rencana Tata Ruang (RDTR 2022) | Jakarta Satu | sebagai komponen skor Kelayakan |
|   |   | Lokasi dan ditampilkan sebagai layer |
|   |   | Zonasi yang dapat diaktifkan atau |
|   |   | dinonaktifkan pada peta. |
|   |   | Pengelompokan hasil analisis |
|   |   | berdasarkan kelurahan dan |
| Batas Wilayah Administratif | Jakarta Satu | kecamatan digunakan untuk |
|   |   | kebutuhan pelaporan serta fitur |
|   |   | export ringkasan simulasi. |

## 5. Rencana Survey Activities

## Lokasi

- Wilayah survey mencakup DKI Jakarta.

- Survey dilakukan pada area di sekitar fasilitas transportasi umum, seperti halte dan stasiun, serta wilayah yang berpotensi menjadi kandidat pembangunan, penambahan, atau perubahan prasarana transportasi umum.

- Titik survey dipilih berdasarkan kebutuhan analisis dan kondisi lokasi yang relevan.

................................................................................................................................................

## Objek

- Halte dan kondisi lingkungan di sekitarnya.

- Kondisi akses pejalan kaki menuju halte.

- Kondisi fasilitas dan lingkungan sekitar halte.

- Aktivitas masyarakat dan tingkat keramaian di sekitar lokasi.


- Keberadaan UMKM atau aktivitas ekonomi.

- Potensi dan permasalahan lokasi yang ditemukan saat observasi.

- Pain points seperti tidak adanya jalur yang teduh, trotoar yang terputus, atau akses menuju halte yang kurang nyaman.

- Potensi lokasi, seperti adanya lahan kosong, kawasan perkantoran, tempat penting, atau area dengan aktivitas tinggi yang belum memiliki akses transportasi umum yang memadai.

- Kondisi lokasi yang mendukung atau menjadi alasan mengapa suatu area memiliki halte.

................................................................................................................................................

## Output

- Foto kondisi sekitar titik survey.

- Deskripsi atau cerita mengenai kondisi lokasi berdasarkan hasil observasi langsung.

- Penilaian kondisi lokasi dalam bentuk deskripsi, termasuk kondisi yang baik maupun kurang baik.

- Pain points dan potensi yang ditemukan di lapangan.

- Lokasi atau titik koordinat hasil survey.

- Catatan tambahan yang relevan dengan kondisi lokasi.

- Foto digunakan sebagai dokumentasi dan tidak diproses oleh AI. Deskripsi hasil observasi digunakan sebagai konteks kualitatif dalam Analisis AI.

## Ketentuan Survey

- Data harus sesuai kondisi lapangan.

- Koordinat harus sesuai lokasi objek.

- Foto harus jelas dan tidak buram.

- Foto tidak boleh menampilkan wajah seseorang secara jelas atau plat nomor kendaraan.

- Data tidak boleh berasal dari sumber manipulasi seperti Google Street View atau internet.

- Data hasil survey perlu divalidasi sebelum digunakan.

- Pemanfaatan Hasil Survey

- Melengkapi dataset dasar.

- Memvalidasi kondisi lapangan.

- Menambahkan titik data pada peta.

- Menjadi input analisis spasial.

- Menjadi dasar insight atau rekomendasi AI.

................................................................................................................................................

## 6. Metode Pengolahan Data, AI, dan Analisis Spasial

## Data Processing

- Cleaning: Community Maps disaring dengan IndoBERT untuk memisahkan postingan relevan (aspirasi transit/pejalan kaki) dari noise. Data Struk Go dan Menu Go distandarisasi ke skema atribut seragam (kategori usaha, lokasi, waktu transaksi).

- Validasi: Titik koordinat divalidasi terhadap batas wilayah administratif (Jakarta Satu) untuk membuang data di luar cakupan. Dokumen regulasi (RDTR 2022, panduan tata ruang) di-embed dengan BGE-M3 dan diindeks ke pgvector untuk retrieval.

- Integrasi: Seluruh dataset dasar (Community Maps, Struk Go, Menu Go) dan data pendukung (GTFS TransJakarta, OSM, RDTR, peta rawan banjir) dimuat ke PostgreSQL + PostGIS sebagai layer spasial terpadu, siap dikueri oleh spatial engine.


## Spatial Analysis

| Analisis | Data Digunakan | Tujuan | Output |
| --- | --- | --- | --- |
|   |   | Menghitung | area |
|   | OSM (jaringan jalan), | terjangkau jalan kaki 5–10 | Skor 0–100 (persentase |
| Akses Jalan Kaki | OSRM, data penduduk | menit dari | titik halte warga terlayani) |
|   |   | mengikuti jalur | jalan |
|   |   | sesungguhnya |   |
|   |   | Mengukur | kepadatan |
|   |   | usaha, proporsi usaha |   |
| Ekonomi UMKM | Struk Go, Menu Go | menetap vs. keliling, dan | Skor 0–100 |
|   |   | keramaian pembeli di |   |
|   |   | sekitar titik |   |
|   |   | Mengecek kesesuaian titik | Status kategori: |
| Kelayakan Lokasi | RDTR 2022, peta rawan | terhadap tata ruang dan | Sesuai/Bersyarat/Tidak |
|   | banjir/InaRISK | risiko banjir | Sesuai + |
|   |   |   | Rendah/Sedang/Tinggi |
|   |   | Mengidentifikasi rute yang |   |
| Konektivitas Rute | GTFS TransJakarta | tetap terhubung | vs. Daftar rute terdampak |
|   |   | berpotensi terputus akibat |   |
|   |   | skenario |   |

Seluruh perhitungan dijalankan sistem komputer (PostGIS + OSRM) secara deterministik parameter yang sama selalu menghasilkan skor yang sama, terlepas dari AI.

## AI Integration

- Input AI: pertanyaan natural language dari pengguna, hasil skor kuantitatif dari spatial engine, konteks kualitatif dari Community Maps (setelah difilter IndoBERT) dan catatan deskriptif Survey Activities, serta potongan dokumen regulasi relevan hasil retrieval pgvector.

- Proses integrasi: Backend Golang menerima pertanyaan pengguna, meneruskannya ke AI Router (LiteLLM, via openai-go) untuk diterjemahkan jadi tool call (simulate_stop, query_area_insight, explain_score). Backend menjalankan tool tersebut ke Spatial Engine untuk kalkulasi deterministik, sekaligus retrieval konteks tambahan dari pgvector. Hasil skor dan konteks dikembalikan ke AI Router untuk disusun jadi satu narasi akhir.

- Output AI: Narasi kesimpulan gabungan (skor + catatan lapangan bila tersedia), jawaban atas pertanyaan area insight, penjelasan rincian skor, dan narasi perbandingan dua skenario. AI hanya menerjemahkan dan menjelaskan tidak pernah menghitung angka sendiri.

## Output

- Ringkasan hasil analisis: Tiga skor (Akses Jalan Kaki, Ekonomi UMKM, Kelayakan Lokasi) plus status konektivitas rute, ditampilkan per titik simulasi.

- Insight/rekomendasi: Narasi otomatis yang menyoroti trade-off hasil simulasi, mis. "warga lebih terjangkau dan dekat UMKM padat, tapi lokasi rawan banjir sedang sehingga halte perlu ditinggikan."

- Prioritas tindakan: Pada mode Perbandingan Skenario, sistem menonjolkan skenario dengan kombinasi skor terbaik di ketiga aspek sebagai rekomendasi utama.


## 7. Fitur Produk dan Acceptance Criteria

| Fitur Produk | Acceptance Criteria |
| --- | --- |
|   | - Pengguna dapat klik titik manapun di peta |
|   | untuk memunculkan popup "Simulasikan di |
| 1. Simulasi Skenario Halte: Pengguna memilih | sini". |
| titik di peta dan skenario perubahan | - Pengguna dapat memilih jenis skenario: |
| (tambah/pindah/tutup sementara), sistem | tambah halte baru, pindah halte eksisting, |
| menjalankan tiga analisis spasial sekaligus | atau tutup sementara. |
| secara deterministik. | - Sistem menghasilkan tiga skor (Akses Jalan |
|   | Kaki, Ekonomi UMKM, Kelayakan Lokasi) |
|   | setelah skenario dijalankan. |
|   | - Layer Halte Existing, Rute Koridor, dan |
|   | Isochrone dapat dinyalakan/dimatikan |
|   | independen lewat panel "Layer Controls". |
|   | - Layer Zonasi (Land Use RDTR, Batas |
| 2. Peta Interaktif & Layer Kontrol: | Ketinggian) dan Demografi (Kepadatan Peta |
| berbasis MAPID MAPS SDK dengan kontrol | Penduduk) dapat ditampilkan sebagai overlay |
| layer Transit, Zonasi, dan Demografi yang bisa | visual di atas peta. |
| di-toggle, serta legenda Eksisting vs Proyeksi. | - Peta menampilkan perbedaan visual antara |
|   | kondisi "Eksisting" dan "Proyeksi" (hasil |
|   | simulasi) secara bersamaan. |
|   | - Isochrone jangkauan jalan kaki mengikuti |
|   | jaringan jalan sesungguhnya (OSRM), bukan |
|   | lingkaran radius lurus. |
|   | - Pengguna dapat mengetik pertanyaan bebas (mis. "apa dampaknya kalau halte dipindah ke sini?") dan sistem merespons dengan hasil analisis relevan. |
|   | - Pengguna dapat menambahkan titik lokasi |
| 3. Chatbot AI (Antarmuka Percakapan): AI | ke chat yang otomatis dipakai AI untuk |
| menerjemahkan pertanyaan natural language | menentukan parameter simulasi (lokasi, |
| menjadi perintah sistem (simulate_stop, | radius) tanpa perlu diketik ulang. |
| query_area_insight, explain_score) | dan - AI hanya menerjemahkan bahasa dan |
| menjelaskan hasil dalam bahasa sederhana. | menyusun penjelasan. Seluruh angka yang |
|   | ditampilkan berasal dari hasil kalkulasi sistem, |
|   | dapat diverifikasi kembali ke skor yang sama. |
|   | - Jika pertanyaan pengguna ambigu atau di |
|   | luar cakupan sistem, AI merespons dengan |
|   | klarifikasi, bukan jawaban mengarang. |
|   | - Setiap skor (0–100) ditampilkan dengan |
|   | indikator warna sesuai tingkat |
|   | (baik/sedang/perlu perhatian). |
|   | - Kelayakan Lokasi menampilkan status |
| 4. Panel Hasil / Detail Skor: Slide-over panel | kategori sederhana (Sesuai/Bersyarat/Tidak |
| menampilkan rincian skor Akses Jalan Kaki, | Sesuai) dan tingkat risiko banjir |
| Ekonomi UMKM, Kelayakan Lokasi, dan | (Rendah/Sedang/Tinggi). |
| Konektivitas Rute untuk satu titik simulasi. | - Panel Konektivitas Rute menampilkan jumlah |
|   | rute yang tetap terhubung dan jumlah rute |
|   | yang berpotensi terputus akibat skenario, |
|   | menjawab kebutuhan persona Rina untuk |
|   | mengetahui dampak ke rute yang biasa |


| Fitur Produk | Acceptance Criteria |
| --- | --- |
|   | digunakan. |
|   | - Setiap skor dapat diklik untuk menampilkan |
|   | rincian komponen penilaian di baliknya (bukan |
|   | angka tunggal tanpa penjelasan). |
|   | - Narasi mencakup kesimpulan gabungan skor |
|   | (mis. "warga lebih terjangkau, dekat UMKM |
|   | padat") dan catatan kualitatif dari data survey |
| 5. Narasi Analisis AI: | Card yang jika tersedia untuk titik tersebut (mis. kondisi |
| menggabungkan kesimpulan dari | skor trotoar, akses, potensi masalah lapangan). |
| kuantitatif dengan konteks kualitatif dari | - Jika titik simulasi tidak memiliki data survey |
| catatan lapangan (Survey Activities) menjadi | pendukung, narasi tetap dihasilkan hanya dari |
| satu paragraf penjelasan yang mudah | skor kuantitatif, tanpa mengarang informasi |
| dipahami. | lapangan yang tidak ada. |
|   | - Narasi dapat ditelusuri kembali ke sumber |
|   | data & skor yang mendasarinya (transparan, |
|   | bukan black box). |
|   | - Pengguna dapat memilih dua skenario/titik |
|   | simulasi untuk dibandingkan berdampingan |
|   | dalam satu layar. |
|   | - Ketiga skor (Akses Jalan Kaki, Ekonomi |
| 6. Perbandingan Skenario: | UMKM, Kelayakan Lokasi) ditampilkan sejajar Tampilan |
| side-by-side dua skenario/lokasi dengan skor | dengan skala dan satuan yang konsisten. |
| sejajar dan narasi komparatif otomatis dari AI. | - AI menghasilkan ringkasan naratif yang |
|   | membandingkan kedua skenario, menyoroti |
|   | aspek mana yang unggul. |
|   | - Peta menampilkan overlay kedua skenario |
|   | sekaligus agar perbedaan jangkauan spasial |
|   | terlihat langsung. |
|   | - Tombol export tersedia di panel hasil |
|   | simulasi maupun panel perbandingan |
| 7. Export Ringkasan Simulasi: | skenario. Pengguna |
| dapat mengunduh ringkasan hasil simulasi | - File hasil export memuat: skor tiga aspek, |
| (skor, peta, narasi) sebagai file PDF/gambar | status kelayakan lokasi, cuplikan peta, dan |
| untuk dibawa sebagai bukti data. | narasi AI untuk titik/skenario terkait. |
|   | - File terunduh dalam format yang dapat |
|   | dibuka tanpa aplikasi khusus (PDF atau |
|   | gambar standar). |
|   | - Pengguna dapat mendaftar dan login |
|   | menggunakan email/password. |
| 8. Autentikasi Dasar: Login sederhana untuk | - Seluruh pengguna terautentikasi memiliki |
| mengakses fitur simulasi, tanpa pembedaan | akses yang sama ke seluruh fitur (tidak ada |
| peran/akses. | role admin/warga/instansi terpisah). |
|   | - Sesi pengguna tetap aktif selama |
|   | menjalankan simulasi tanpa perlu login |
|   | berulang. |


## 8. Persyaratan Teknis

- Frontend: Next.js yang terintegrasi dengan MAPID MAPS SDK untuk menampilkan peta dan GEO MAPID Editor untuk mengelola layer data.

- Backend: Golang sebagai bahasa utama untuk menjalankan REST API, mengatur request, dan melakukan kalkulasi spasial. Proses klasifikasi teks menggunakan IndoBERT dan embedding menggunakan BGE-M3 dijalankan melalui microservice Python.

- AI Orchestration: Menggunakan LiteLLM sebagai router dengan antarmuka OpenAI-compatible untuk menghubungkan aplikasi dengan model AI serta memudahkan penggunaan atau pergantian provider.

- Database: PostgreSQL + PostGIS untuk menyimpan dan mengolah data geospasial, dengan pgvector untuk menyimpan dan mencari embedding dokumen regulasi dalam proses RAG.

- Spatial Engine: OSRM digunakan untuk menghitung rute dan isochrone pejalan kaki berdasarkan jaringan jalan sebenarnya.

- Caching: Redis digunakan untuk menyimpan hasil query yang sering digunakan agar proses pemuatan data lebih cepat.

- Deployment: Frontend direncanakan menggunakan Vercel/Netlify, sedangkan backend Golang, microservice Python, dan database dijalankan pada cloud dengan spesifikasi minimal 4 vCPU dan 16 GB RAM. AI dihubungkan melalui LiteLLM ke Google AI Studio API atau provider lain yang mendukung OpenAI-compatible endpoint.

## Technology Architecture

.

Diagram tersebut menggambarkan arsitektur sistem yang menghubungkan User, Frontend, Backend, Database, layanan peta, dan AI. User mengakses WebGIS melalui React/Next.js yang menggunakan MAPID Maps SDK untuk menampilkan informasi spasial. Permintaan dari frontend


diteruskan ke FastAPI sebagai backend, yang memproses request, melakukan query ke PostGIS, serta memanfaatkan OSRM untuk kebutuhan informasi rute. Untuk fitur berbasis AI, backend mengirimkan data dan permintaan ke LLM Gateway yang terhubung dengan Google AI SDK/LLM Model untuk menghasilkan respons. Data dari Data Activity MAPID, Data POI MAPID, dan Data Pendukung diproses melalui NLP Pipeline kemudian disimpan ke PostGIS agar dapat digunakan oleh sistem.

## 9. User Flow / Wireframe

## User Flow

*Untuk gambar lebih jelas dapat di akses melalui link berikut: cetazzcetazz_LokaMaya.png [URL 🔗](https://drive.google.com/file/d/1XaAg1gsmwo0GYNh5gNuc0QApSskW_kUL/view?usp=sharing)*

User Flow LokaMaya menggambarkan tahapan interaksi pengguna mulai dari mengakses aplikasi hingga memperoleh hasil simulasi perubahan halte. Alur dirancang agar pengguna dapat melakukan simulasi melalui interaksi langsung dengan peta maupun melalui AI Chat. Peta menjadi antarmuka utama untuk menentukan lokasi, sedangkan AI digunakan sebagai antarmuka percakapan yang membantu menerjemahkan pertanyaan pengguna menjadi perintah simulasi dan menjelaskan hasil analisis.

Secara umum, pengguna memulai dari Landing Page dan memilih tombol “Mulai Simulasi” untuk masuk ke halaman Peta Simulasi. Pada halaman tersebut, pengguna dapat memilih lokasi dengan mengklik halte existing atau titik kosong pada peta. Pengguna kemudian dapat menjalankan simulasi secara langsung atau menambahkan lokasi ke Context Chip pada AI Chat untuk memberikan konteks terhadap pertanyaan yang ingin disampaikan.

Setelah lokasi dan skenario ditentukan, sistem menjalankan proses analisis secara deterministik menggunakan data spasial yang tersedia. Analisis mencakup Akses Jalan Kaki, Ekonomi UMKM, Kelayakan Lokasi, dan Konektivitas Rute. Hasil perhitungan kemudian divisualisasikan pada peta dan Panel Hasil. AI selanjutnya menyusun penjelasan berdasarkan hasil perhitungan tersebut serta konteks kualitatif dari Survey Activities apabila tersedia.

Dengan demikian, alur LokaMaya tidak menjadikan AI sebagai pengganti proses analisis spasial. Sistem bertanggung jawab terhadap perhitungan dan menghasilkan nilai yang konsisten, sedangkan AI berperan dalam memahami input pengguna, memanggil fungsi sistem yang sesuai, dan menjelaskan hasil analisis menggunakan bahasa yang lebih mudah dipahami.

| Tahap | Tindakan Pengguna |   | Proses Sistem | Output kepada Pengguna |
| --- | --- | --- | --- | --- |
| Titik Awal | Pengguna membuka | Sistem | membuka | Peta interaktif dengan |
|   | LokaMaya dan memilih | halaman Peta Simulasi |   | layer halte, rute, dan |
|   | “Mulai Simulasi” | dan memuat | layer | data pendukung |
|   |   | yang tersedia |   |   |


| Tahap | Tindakan Pengguna | Proses Sistem | Output kepada Pengguna |
| --- | --- | --- | --- |
| Menentukan Lokasi | Pengguna mengklik | Sistem | Popup berisi informasi |
|   | halte existing atau titik | mengidentifikasi | lokasi dan pilihan |
|   | kosong pada peta | objek/lokasi yang | tindakan |
|   |   | dipilih dan |   |
|   |   | menampilkan Map |   |
|   |   | Quick-Action Popup |   |
| Menentukan Skenario | Pengguna memilih | Sistem menentukan | Lokasi asal/tujuan dan |
|   | simulasi langsung atau | parameter lokasi dan | jenis simulasi |
|   | menambahkan lokasi | jenis skenario | terdefinisi |
|   | ke AI Chat |   |   |
| Menjalankan Simulasi | Pengguna menjalankan | Backend memproses | Status loading |
|   | simulasi atau mengirim | parameter dan | ditampilkan selama |
|   | pertanyaan melalui AI | menjalankan analisis | proses analisis |
|   | Chat | spasial |   |
| Analisis Spasial | — | Sistem menghitung | Nilai skor, status, delta, |
|   |   | akses jalan kaki, | dan informasi spasial |
|   |   | ekonomi UMKM, |   |
|   |   | kelayakan lokasi, dan |   |
|   |   | konektivitas rute |   |
| Analisis Kontekstual | — | AI menerima hasil | Narasi Analisis AI |
|   |   | perhitungan dan data |   |
|   |   | survey yang relevan |   |
|   |   | untuk menyusun |   |
|   |   | penjelasan |   |
| Menampilkan Hasil | Pengguna melihat hasil | Sistem menampilkan | Isochrone, skor, status |
|   | pada peta dan Panel | visualisasi dan rincian | kelayakan, rute, dan |
|   | Hasil | hasil | kesimpulan |
| Eksplorasi Lanjutan | Pengguna memilih | Sistem membuka Detail | skor, |
|   | “Lihat Detail”, | detail atau | perbandingan |
|   | “Bandingkan”, atau | menjalankan proses | skenario, atau simulasi |
|   | “Ubah Lokasi” | lanjutan sesuai pilihan | baru |
| Export | Pengguna memilih | Sistem menyusun | File PDF/gambar berisi |
|   | tombol Export | ringkasan simulasi | hasil simulasi |

................................................................................................................................................

................................................................................................................................................

## Wireframe

Wireframe LokaMaya dirancang untuk mendukung alur simulasi yang sederhana dan mudah dipahami, mulai dari Landing Page, Peta Simulasi sebagai antarmuka utama, panel Layer Control untuk mengatur tampilan data spasial, Panel Hasil Skor, Perbandingan Skenario, hingga panel AI Chat sebagai antarmuka percakapan. Rancangan detail setiaphalaman dapat dilihat pada tautan berikut: cetazzcetazz_LokaMaya_WEBGIS Competition 2026 [URL 🔗](https://www.figma.com/design/GlqOo61bJsFSpsu0ziIuFZ/WEBGIS-Competition-2026?node-id=0-1&t=FG6QoYLizJij6Zmf-1)

- Landing Page


- Peta Simulasi


- Panel Hasil Skor


- Panel AI


- Perbandingan Skenario


................................................................................................................................................

................................................................................................................................................

## 10. Timeline Development

| Minggu | Fokus Kegiatan | Target Output |
| --- | --- | --- |
| M1 | Survey Activities dan | Data hasil survey dan dataset |
|   | pengumpulan data | awal |
| M2 | Pengolahan dan validasi data | Dataset yang siap digunakan |
|   |   | untuk pengembangan |
| M3 | Pengembangan WebGIS dan | Prototype WebGIS dan analisis |
|   | analisis spasial | spasial awal |


| Minggu | Fokus Kegiatan | Target Output |
| --- | --- | --- |
| M4 | Integrasi AI dan fitur WebGIS | Fitur AI dan fitur utama |
|   |   | WebGIS terintegrasi |
| M5 | Pengembangan lanjutan dan | Prototype WebGIS yang lebih |
|   | integrasi seluruh komponen | lengkap |
|   | Mentoring dan perbaikan | Hasil pengembangan |
| M6 | produk | berdasarkan masukan |
|   |   | mentoring |
| M7 | Pengujian dan finalisasi | WebGIS yang sudah diuji dan |
|   | WebGIS | diperbaiki |
| M8 | Finalisasi dan persiapan | Video, code, dan link WebGIS |
|   | submission | siap dikumpulkan |

## 11. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
|   |   | Melakukan pengecekan dan |
| Ketersediaan dan kualitas | Hasil analisis dapat kurang | pembersihan data sebelum |
| dataset tidak | akurat atau tidak dapat sesuai | digunakan serta |
| kebutuhan | digunakan pada beberapa | menggunakan data |
|   | lokasi | pendukung dari sumber yang |
|   |   | tersedia |
|   | Skor aksesibilitas, ekonomi | Melakukan validasi melalui |
| Hasil analisis spasial tidak | UMKM, atau kelayakan lokasi | Survey Activities dan |
| sesuai dengan | kondisi dapat | kurang membandingkan hasil analisis |
| lapangan | merepresentasikan | kondisi dengan kondisi lapangan |
|   | sebenarnya |   |
|   |   | AI hanya digunakan untuk |
|   | Informasi yang disampaikan | memahami perintah dan |
| AI memberikan interpretasi | kepada pengguna dapat | menjelaskan hasil, sedangkan |
| atau narasi yang kurang | menimbulkan | perhitungan skor dilakukan |
| sesuai | kesalahpahaman | terhadap oleh sistem berdasarkan data |
|   | hasil simulasi | dan formula yang telah |
|   |   | ditentukan |
|   | Pengembangan WebGIS | Melakukan pengembangan |
| Integrasi berbagai komponen | dapat terhambat | dan pengujian secara atau |
| sistem mengalami kendala | beberapa fitur tidak berjalan | bertahap pada frontend, |
|   | secara optimal | backend, database, spatial |
|   |   | engine, dan layanan AI |

## 12. Rencana Deployment

| Komponen | Rencana |
| --- | --- |
|   | Frontend akan di-deploy menggunakan Vercel |
| Hosting | atau Netlify. Backend, microservice, database, |
|   | dan service pendukung dijalankan pada cloud. |


| Komponen | Rencana |
| --- | --- |
|   | PostgreSQL + PostGIS untuk penyimpanan data |
| Database | geospasial dan pgvector untuk penyimpanan |
|   | serta pencarian embedding dokumen. |
|   | Menggunakan GitHub untuk menyimpan source |
| Repository | code, dokumentasi, dan konfigurasi proyek. |

## 13. Lampiran


## a Stefany Josefina Santono

## Survey Activity - Halte Kemanggisan

Halte Kemanggisan berada di kawasan yang cukup ramai dengan adanya gedung perkantoran, hotel, area komersial, dan sekolah di sekitarnya. Dari kondisi jalan dan trotoar yang terlihat, kawasan ini cukup dilalui kendaraan maupun pejalan kaki, sehingga halte dapat menjadi akses transportasi yang dibutuhkan oleh pekerja, tamu hotel, pelajar, dan masyarakat sekitar. Keberadaan berbagai aktivitas tersebut membuat lokasi ini cukup potensial untuk mendukung penggunaan transportasi umum dalam perjalanan sehari-ha

#eetazzcetazz

## Stefany Josefina Santono

## Survey Activity Halte Gelora Bung Karno 3

Halte Gelora Bung Karno 3 memiliki akses yang cukup strategis Karena berada dekat dengan kawasan GEK dan didukung akses jalan Serta jalur pedestrian yang cukup baik. Pengguna yang naik dari Halte Senayan Bank Jakarta dengan tujuan di area GEK dapat melanjutkan perjalanan hingga halte ini, sehingga tidak perlu berjalan terlalu jauh dari titik pemberhentian. Kedekatannya dengan halte besar dan

berbagai pusat aktivitas

menjadi ttik yang cukup nyaman bagi pengguna transportasi umum untuk melanjutkan perjalanan menuju tujuan mereka. #cetazzcetazz

hatte ini

## Stefany Josefina Santono

## Survey Activity - Halte Wi lya Chandra Telkomsel

Halte Widya Chandra Telkomsel berada di kawasan perkantoran dan pusat bisnis yang strategis. Di sekitarnya terdapat gedung-gedung tinggi, fasilitas penting seperti Grha BPJamsostek, serta kawasan komersial yang padat akivitas, menjadikannya titik transit yang pening bagi para pekerja maupun masyarakat yang beraktivitas di sekitar koridor ini. Halte ini dilengkapi dengan fasilitas penunjang yang memadai untuk melayani mobilitas pengguna transportasi umum di tengah arus lalu lintas perkotaan yang ramai. #icetazzcetazz

## Stefany Josefina Santono

sebagai titik

aren brads dengan aks

ukup tinggi, dengan keberadaan Rumah Sakit Roy:

prkantora, seta sres komersal di

menuju halte juga didukung oleh jalur pedestrian dan jembatan penyeberangan, memudahkan masyarakat untuk mencapai sehingga halte dengan lebih aman. Dengan kondisi alu lintas yang cukup aktif

Serta banyaknya fasiltas dan aktivitas di

berpotensi melayani masyarakat yang bepergian menuju fasiitas

area komersial, maupun kawasan permukiman di

sekitarnya.

## Survey Halt Activity - Halte Jelambar

yang

Akses

hate ini


## a Stefany A Josefina Santono +

## Survey Activity - Halte Simpang Kuningan

Halte Simpang Kuningan berada di Jalan Jenderal Gatot Subroto dan melayani koridor utama Transjakarta yang dikelingi oleh kawasan bisnis, perkantoran komersial penting, serta gedung-gedung instansi pemerintah. Di sekitar halte ini terdapat berbagai fasiltas penting seperti Balai Kartini, Tempo Scan Tower, kompleks Badan Urusan Logistik (Bulog), serta kawasan perkantoran strategis lainnya yang menjadi pusat mobilitas harian para pekerja. Halte ini juga memiliki fasilitas terintegrasi yang terhubung dengan layanan koridor lain serta berada dekat dengan jalur transportasi publik modern, menjadikannya titik transit yang krusial untuk mendukung konektivitas di kawasan perkotaan yang padat. #cetazzcetazz

## Stefany Josefina Santono

## Survey Activity - Halte Senayan Bank Jakarta

Halte Senayan Bank Jakarta berada di kawasan yang didominasi gedung perkantoran dan akivitas perkotaan yang cukup padat. Di sekitar halte terlihat gedung-gedung bertingkat serta fasilitas

mobilitas pekerja

olahraga, sehingga lokasi ini berpotensi melayani

maupun masyarakat yang

dilengkapi informasi arah yang jelas, akses menuju pintu, musala, toilet, serta toilet aksesibel. Di sisi luar halte terdapat jembatan penghubung untuk pejalan kaki, sementara jalan di depan halte cukup lebar dengan lalu lintas kendaraan yang ramai, sehingga keberadaan akses pejalan kaki menjadi penting untuk mendukung Pengguna transportasi #cetazzcetazz

beraktivitas di kawasan Senayan. Halte juga


## Stefany Josefina Santono

## Survey Activity - Halte Petamburan

Halte Petamburan berada di kawasan perkotaan yang cukup padat dan dikeliingi oleh area permuliman warga, fasilitas umum, serta akses jalan raya yang sibuk. Di sekitar halte terlihat aktivitas mobilitas harian yang tinggi, termasuk area parkir motor dan tik transit yang

dimanfaatkan oleh

para pengguna

melanjutkan perjalanan. Halte ini dilengkapi dengan papan informasi ute serta petunjuk arah yang jelas bagi penumpang. Jalan di sekitar halte memiliki volume kendaraan yang rama, sehingga keberadaan halte ini memegang peranan penting dalam mendukung aksesibilitas dan konektivitas warga yang menggunakan layanan transportasi massal. icetazzcetazz

transportasi umum untuk

mo Do

## Stasiun MRT Bendungan Hilir

Stasiun MRT Bendungan Hilir (Benhil)terletak di kawasan pusat bisnis

Jalan Jenderal Sudirman sangat padat dan dikelilingi oleh

yang

gedung-gedung perkantoran bertingkat tinggi, pusat perbelanjaan, Serta area komersial populer. Di sekitar stasiun ini terdapat berbagai fasilitas penting seperti kawasan Sudirman Central Business District (SCBD), area transit terintegrasi dengan halte Transjakarta, serta dekat dengan pusat kuliner dan perbelanjaan legendaris seperti kawasan Bendungan Hilir (Benhil) yang terkenal sebagai sentra kuliner. Keberadaan stasiun ini memegang peranan vital dalam memfasilitasi mobilitas harian para pekerja kantoran dan masyarakat urban, serta memperkuat konektivitas antarmoda transportasi publik di jantung kota Jakarta. #cetazzcetazz

## Stefany Josefina Santono

## Survey Activity - Halte Jembatan Gantung

Halte Jembatan Gantung berada di kawasan koridor jalan arteri yang dikelilingi oleh area permukiman warga, fasilitas umum, serta kawasan komersial yang cukup aktif. Di sekitar halte terlihat jembatan penyeberangan orang (JPO) yang menghubungkan kedua sisi jalan serta area terbuka yang sedang mengalami proyek pembangunan baru (new development). Keberadaan di dekat area yang sedang berkembang ini dapat meningkatkan potensi kawasan sekitar dengan mempermudah mobilitas pekerja maupun calon penghuni masa depan untuk mengakses transportasi mendorong pertumbuhan ekonomi lokal, serta memperkuat konektivitas wilayah agar terhubung dengan pusat-pusat aktivitas perkotaan.

yo Do

## Stefany Josefina Santono

## Survey Activity - Halte Bundaran Senayan 2

Halte Bundaran Senayan 2 berada di kawasan yang didominasi gedung perkantoran dan aktivitas perkotaan yang cukup padat. Di sekitar halte terlihat gedung-gedung bertingkat tinggi, seperti area perkantoran komersial dan bank di sepanjang jalan protokol, sehingga

ini sangat strategis dalam melayani mobilitas para pekerja

maupun masyarakat yang beraktivitas di pusat kota. Halte ini dilengkapi dengan fasilitas penunjang seperti peta rute serta papan informasi bagi calon penumpang. Di sekitar area halte juga terdapat lanskap hijau dengan pepohonan yang rindang, sementara jalan di depan halte menmiliki lajur kendaraan yang rama, menjadikan keberadaan halte dan aksesibilitas di sekitarnya sangat penting untuk

pengguna

umum,

#cetazzcetazz


## Stefany Josefina Santono

## Survey Activity - Halte Rasuna Said

Halte Rasuna Said berada di kawasan perkantoran dan pusat bisnis yang ramai di sepanjang Jalan HR Rasuna Said. Di sekitarnya terdapat gedung-gedung tinggi, fasilitas penting seperti Plaza Festival dan GOR Soemantri Brodjonegoro, serta area perkantoran komersial, menjadikannya titik transit yang sangat strategis bagi para pekerja maupun masyarakat yang beraktivitas di koridor ini. Halte ini dilengkapi dengan fasilitas penunjang seperti papan informasi ute digital, petunjuk arah keluar yang jelas, serta sistem penerangan yang baik. Jalan di depan halte merupakan jalur utama dengan volume lalu lintas kendaraan yang padat, sehingga keberadaan hate ini memegang peranan vital dalam mendukung konektivitas serta kemudahan akses pengguna transportasi umun. #cetazzcetazz

## ivana

.

## Stasiun KRL Rawa Buntu

Stasiun KRL Rawa Buntu terletak di kawasan perkotaan yang sedang berkembang pesat di Tangerang Selatan, tepatnya di sekitar kawasan BSD City. Di sekitarnya terdapat kawasan permukiman modern, area komersial, gedung perkantoran, serta fasilitas publik seperti pusat perbelanjaan dan institusi pendidikan yang memadati koridor utama kawasan tersebut. Stasiun ini merupakan salah satu simpul transit penting yang melayani mobilitas harian para pelaju komuter lintas Serpong-Tanah Abang. Dilengkapi dengan fasilitas integrasi antarmoda memadai seperti area penjemputan ojek online, yang kantong park, serta akses jalan raya yang dinamis,

perafen ital dalam

nf

dankemudatian mabllitas Masyarakat dari panyangga menu]u pusat kota. #cetazzcetazz

yo Do

ivana

## Stasiun MRT Lebak Bulus

Stasiun MRT Lebak Bulus terletak di kawasan perkotaan yang sangat strategis dan berkembang pesat sebagai salah satu simpul transit Utama di Jakarta Selatan. Stasiun in terintegrasi secara langsung dengan area komersial, gedung perkantoran modern, serta pusat perbelanjaan populer di sekitarnya seperti Point Square (POINS) yang terhubung langsung melalui akses jembatan dan lift, sehingga memudahkan mobilitas bagi para pelaju dan masyarakat urban. Di sekitar stasiun juga terdapat area depo MRT, fasilitas kantong parkir yang luas, serta akses mudah menuju jaringan transportasi umum

Keberadaan stasiun ini memegang peranan vital dalam

mendorong pertumbuhan ekonomi kawasan sekitar serta menyediakan konektivitas transportasi massal yang efisien dan nyaman bagi warga. #cetazzcetazz

## Stefany Josefina Santono

Halte Bendungan Hil 1 berada di kawasan perkantoran dan pusat

di sepanjang koridor Jalan Jenderal

Di sekitarnya terdapat gedung-gedung pencakar langit,

yong mad

ya put MRT Bendungan Hilr, serta

rash tama

transportasi lain seperti Stasiun gkapi

seperti papan

pejalan kaki yang memadai. Dengan arus lintas kendaraan di jar protokol yang sangat tinggi, keberadaan hate ini sangat penting untuk mendukung kemudahan akses dan konektivitas transportasi publik di jantung kota. #cetazzcetazz

## Survey Activity - Halte Bendungan Hilir 1

harian

para

od

informasi


## Stefany Josefina Santono

## Survey Activity - Halte Sampoerna Strategic

Halte Sampoerna Strategic berada di kawasan perkantoran dan pusat bisnis yang sangat padat di sepanjang koridor Jalan Jenderal Sudirman. Di sekitar halte ini terdapat gedung perkantoran terkemuka ‘Sampoerna Strategic Square, serta berbagai gedung pencakar langit dan kawasan bisnis komersial lainnya yang menjadi pusat aktivitas harian para pekerja kantoran dan masyarakat urban. Halte ini dilengkapi dengan fasilitas penunjang seperti papan informasi rute bus, jalur pedestrian yang nyaman, serta petunjuk arah yang jelas bagi para penumpang. Jalan di depan halte merupakan salah satu jalur protokol utama dengan volume lalu intas kendaraan yang tinggi, sehingga keberadaan halte ini memegang peranan krusial dalam mendukung kemudahan akses serta konektivitas transportasi umum di jantung kota, #cetazzcetazz

## a Stefany Josefina Santono

## Survey Activity - Halte Tanjung Duren

Halte Tanjung Duren layak dikembangkan karena berada di kawasan dengan aktivitas perkotaan yang terlinat dari keberadaan Central Park, gedung perkantoran, apartemen, serta pusat kegiatan komersial di sekitarnya. Lokasi juga memiliki akses jembatan penyeberangan yang dapat menjadi konektivitas langsung bagi calon penumpang menuju hate, sehingga akses pejalan kaki lebih aman dibandingkan harus menyeberangi jalan secara langsung. Kondisi jalan yang lebar dan memiliki arus kendaraan cukup tinggi juga menunjukkan adanya kebutuhan fasiltas transportasi umum yang terintegrasi dan mudah dijangkau. Dengan adanya hate di kawasan ini, masyarakat yang beraktivitas di pusat perbelanjaan, perkantoran, maupun hunian di sekitar Tanjung Duren dapat memiliki akses yang lebih mudah ke transportasi umum sekaligus mendukung perpindahan moda dari kendaraan pribadi ke TransJakarta, #cetazzcetazz


## ry Stefany Josefina Santono

=

## Survey ity - Gelora Bung Karno 1

Halte Gelora Bung Karno (GBK) 1 berada di kawasan pusat olahraga, komersial, dan perkantoran yang sangat strategis di sepanjang

terdapat kompleks

koridor Jalan Jenderal Sudirman. Di

olahraga nasional Gelora Bung Karno, pusat perbelanjaan terkemuka seperti fX Sudirman dan Plaza Senayan, serta deretan gedung perkantoran bertingkat tinggi yang memadati kawasan ini. Halte ini berfungsi sebagai titik transit utama yang rama dikunjungi oleh masyarakat, pekerja, maupun pengunjung yang ingin mengakses fasilitas olahraga, pusat perbelanjaan, atau terintegrasi langsung dengan moda transportasi lain seperti stasiun MRT di sekitarnya Dengan jalur protokol yang memiliki volume lalu lintas pada, keberadaan halte ini memegang peranan krusial dalam mendukung kelancaran mobilitas dan konektivitas transportasi umum di jantung Kota.

ivana

.

## Stasiun Tanah Abang

Stasiun Tanah Abang merupakan salah satu stasiun kereta api transit paling sibuk dan krusial di Jakarta yang melayani perjalanan KRL

fof ree

nar 9

a,

di

Tenggara,

Asia

berbagai ruko dan pusat aktivitas komersial. Berkat lokasi

dari arah Manggarai, Bogor, Serpe

yang menjadi titk temu jalur

Sandan, n ete

ribuan pelaju, pekerja, dan pedagang. Di sekitar area stasiun terdapat

fasilitas

penunjang integrasi moda transportasi seperti area naik-

turun ojek online, halte bus, serta jalur pedestrian yang ramai, sehingga keberadaan Stasiun Tanah Abang memegang peranan vital

aes

Abang, ser

kawasan

Paser Tanah

Do

## ry Stefany Josefina Santono

## Survey Activity - Halte Damai

Halte Damai meniliki lokasi yang cukup strategis untuk menunjang mobilitas masyarakat karena berada di Jalan Daan Mogot, salah satu ruas jalan dengan aktivitas kendaraan yang tinggi. Dari hasil pengamatan, di sekitar halte terdapat area komersial seperti SPBU dan usaha lainnya, serta akses menuju kawasan permukiman dan aktivitas masyarakat. Kondisi jalan yang ramai membuat keberadaan halte penting untuk menyediakan akses transportasi umum di tengah tingginya pergerakan kendaraan. Selain itu, Halte Damai merupakan titik strategis karena melayani beberapa rute Transjakarta, yang termasuk Koridor 3 dan rute 3F menuju Senayan Bank Jakarta, serta terhubung dengan layanan Koridor 8. Dengan adanya halte di lokasi ini, masyarakat dari kawasan sekitar maupun pengguna yang melakukan perjalanan melintasi Daan Mogot memiliki alternatif transportasi umum yang lebih mudah dijangkau tanpa harus bergantung pada kendaraan pribadi. #cetazzcetazz

Do
