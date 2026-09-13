"use client";
import React from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { 
  Database, 
  Sigma, 
  Store, 
  Bot, 
  PersonStanding, 
  ShieldAlert, 
  Route, 
  AlertTriangle, 
  Compass, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function MetodologiPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FBF8FA] font-sans overflow-x-hidden text-[#1B1B1D]">
      <Navbar />

      <main className="flex flex-col items-center w-full px-4 md:px-8 py-10 md:py-16">
        <div className="flex flex-col gap-14 w-full max-w-5xl">
          
          {/* Header Section */}
          <section className="flex flex-col gap-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E8EDF9] text-[#1B4D89] text-xs font-semibold rounded-full w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparansi Algoritma & Sains Data Spasial</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#091426] leading-tight tracking-tight">
              Metodologi, Model Matematis & Keterbatasan Sistem
            </h1>
            <p className="text-base text-[#45474C] leading-relaxed">
              LokaMaya dibangun di atas fondasi analitik spasial deterministik (PostGIS &amp; OpenStreetMap OSRM) yang dipadukan dengan orkestrasi AI Multi-Agent. Kami menjunjung transparansi penuh: seluruh rekomendasi intervensi halte dan transit didasarkan pada formula matematis terukur, bukan halusinasi generatif. Halaman ini mendokumentasikan spesifikasi dataset, formula skoring, hierarki penempatan spasial, serta keterbatasan teknis sistem kami.
            </p>
          </section>

          {/* Dataset Table Section */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D5E3FD] rounded-lg text-[#1B4D89]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#091426]">1. Katalog Dataset Spasial &amp; Konteks (7 Core Layers)</h2>
                <p className="text-xs text-[#5E626E]">Seluruh data diintegrasikan ke dalam database spasial PostGIS dengan proyeksi EPSG:4326 / WGS 84.</p>
              </div>
            </div>
            
            <div className="w-full bg-white border border-[#C5C6CD] rounded-xl shadow-xs overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-[#F5F3F4] border-b border-[#C5C6CD]">
                    <th className="py-3.5 px-5 font-mono font-semibold text-xs text-[#45474C] uppercase tracking-wider w-[22%]">Layer Dataset</th>
                    <th className="py-3.5 px-5 font-mono font-semibold text-xs text-[#45474C] uppercase tracking-wider w-[20%]">Sumber &amp; Format</th>
                    <th className="py-3.5 px-5 font-mono font-semibold text-xs text-[#45474C] uppercase tracking-wider w-[58%]">Fungsi &amp; Operasi Spasial dalam Sistem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E4EB] text-sm">
                  <tr className="hover:bg-[#FBF8FA] transition-colors">
                    <td className="py-3.5 px-5 font-medium text-[#091426]">
                      <div className="font-semibold">TransJakarta GTFS &amp; Rute</div>
                      <span className="text-[11px] text-[#5E626E] font-mono">transjakarta_routes &amp; stops</span>
                    </td>
                    <td className="py-3.5 px-5 text-[#45474C]">
                      PT Transportasi Jakarta / Dishub DKI (81 koridor MultiLineString, 7.460 titik halte: 306 BRT elevated + 7.154 feeder).
                    </td>
                    <td className="py-3.5 px-5 text-[#1B1B1D]">
                      Penentuan titik aksesibilitas <i>first/last-mile</i>, penelusuran kontinuitas transfer antarkoridor, dan sumbu <i>snapping</i> halte usulan.
                    </td>
                  </tr>

                  <tr className="hover:bg-[#FBF8FA] transition-colors">
                    <td className="py-3.5 px-5 font-medium text-[#091426]">
                      <div className="font-semibold">RDTR DKI Jakarta 2022</div>
                      <span className="text-[11px] text-[#5E626E] font-mono">rdtr_zones</span>
                    </td>
                    <td className="py-3.5 px-5 text-[#45474C]">
                      Dinas Cipta Karya, Tata Ruang &amp; Pertanahan DKI Jakarta (Polygon zonasi tata ruang).
                    </td>
                    <td className="py-3.5 px-5 text-[#1B1B1D]">
                      Validasi kesesuaian lahan halte usulan via <code>ST_Contains</code>. Mengidentifikasi zona transit campuran (K1, K2), hunian (R1–R5), dan ruang terbuka hijau (H).
                    </td>
                  </tr>

                  <tr className="hover:bg-[#FBF8FA] transition-colors">
                    <td className="py-3.5 px-5 font-medium text-[#091426]">
                      <div className="font-semibold">Peta Bahaya Banjir (Flood Risk)</div>
                      <span className="text-[11px] text-[#5E626E] font-mono">flood_hazard</span>
                    </td>
                    <td className="py-3.5 px-5 text-[#45474C]">
                      InaRISK BNPB &amp; BPBD DKI Jakarta (Polygon multi-skala: Rendah, Sedang, Tinggi).
                    </td>
                    <td className="py-3.5 px-5 text-[#1B1B1D]">
                      Evaluasi kerentanan lingkungan rute komuter dan titik halte baru. Memicu <i>flood penalty</i> (+20 poin friksi) jika lintasan melewati area tergenang.
                    </td>
                  </tr>

                  <tr className="hover:bg-[#FBF8FA] transition-colors">
                    <td className="py-3.5 px-5 font-medium text-[#091426]">
                      <div className="font-semibold">MAPID Community Maps</div>
                      <span className="text-[11px] text-[#5E626E] font-mono">community_maps</span>
                    </td>
                    <td className="py-3.5 px-5 text-[#45474C]">
                      Crowdsourced MAPID &amp; Klasifikasi NLP IndoBERT Transit.
                    </td>
                    <td className="py-3.5 px-5 text-[#1B1B1D]">
                      Sentimen warga dan laporan titik <i>bottleneck</i> jalan kaki / fasilitas halte. Menjadi bobot penentu prioritas penanganan koridor kritis.
                    </td>
                  </tr>

                  <tr className="hover:bg-[#FBF8FA] transition-colors">
                    <td className="py-3.5 px-5 font-medium text-[#091426]">
                      <div className="font-semibold">Struk Go &amp; Menu Go</div>
                      <span className="text-[11px] text-[#5E626E] font-mono">struk_go &amp; menu_go</span>
                    </td>
                    <td className="py-3.5 px-5 text-[#45474C]">
                      Data transaksi ritel mikro &amp; titik pelaku usaha mikro MAPID.
                    </td>
                    <td className="py-3.5 px-5 text-[#1B1B1D]">
                      Menghitung densitas aktivitas ekonomi pejalan kaki dan rasio usaha informal/kaki lima (<i>street vitality</i>) dalam radius 400–500m dari halte.
                    </td>
                  </tr>

                  <tr className="hover:bg-[#FBF8FA] transition-colors">
                    <td className="py-3.5 px-5 font-medium text-[#091426]">
                      <div className="font-semibold">Knowledge Base Regulasi</div>
                      <span className="text-[11px] text-[#5E626E] font-mono">regulations (pgvector)</span>
                    </td>
                    <td className="py-3.5 px-5 text-[#45474C]">
                      14 Peraturan Perundangan (UU No. 22/2009, Permenhub No. 10/2012, Pergub DKI No. 31/2022).
                    </td>
                    <td className="py-3.5 px-5 text-[#1B1B1D]">
                      Retriever RAG untuk AI Urban Planning Council menggunakan embeddings BGE-M3 (1024 dimensi) untuk justifikasi hukum yang kredibel.
                    </td>
                  </tr>

                  <tr className="hover:bg-[#FBF8FA] transition-colors">
                    <td className="py-3.5 px-5 font-medium text-[#091426]">
                      <div className="font-semibold">OpenStreetMap &amp; OSRM Engine</div>
                      <span className="text-[11px] text-[#5E626E] font-mono">OSRM Foot &amp; Car Graph</span>
                    </td>
                    <td className="py-3.5 px-5 text-[#45474C]">
                      Geofabrik OSM Indonesia (Engine OSRM lokal microservice).
                    </td>
                    <td className="py-3.5 px-5 text-[#1B1B1D]">
                      Perhitungan <i>real-path</i> jalan kaki, radius jangkauan isochrone (5, 10, 15 menit), serta penelusuran lekukan jalan arteri non-linier.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Scoring Formulas Section */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D5E3FD] rounded-lg text-[#1B4D89]">
                <Sigma className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#091426]">2. Logika Pemodelan Spasial &amp; Formula Matematis</h2>
                <p className="text-xs text-[#5E626E]">Formula deterministik yang dieksekusi langsung pada backend Go &amp; PostGIS.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Walk Accessibility */}
              <div className="flex flex-col bg-white border border-[#C5C6CD] border-l-4 border-l-[#1B4D89] shadow-xs rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-semibold uppercase text-[#1B4D89] tracking-wider">Metrik 01</span>
                    <h3 className="text-xl font-bold text-[#1E293B]">Skor Aksesibilitas Pejalan Kaki</h3>
                  </div>
                  <div className="p-2 bg-[#E8EDF9] rounded-lg text-[#1B4D89]">
                    <PersonStanding className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#F0EDEF] rounded-lg p-3 mb-3">
                  <div className="font-mono text-xs text-[#091426] font-semibold">
                    Score = clamp(TransitGap + Vitality + ZoneScore, 35, 96)
                  </div>
                  <div className="text-[11px] font-mono text-[#5E626E] mt-1">
                    Bobot: Transit Gap (45%) | Vitalitas Aktivitas (35%) | RDTR (20%)
                  </div>
                </div>

                <div className="text-xs text-[#45474C] space-y-2 leading-relaxed">
                  <p>
                    <strong>A. Transit Gap (Maks 50 poin):</strong> Bernilai optimal (42 poin) jika jarak halte eksisting terdekat antara 350m–750m (jarak transit ideal). Jika terlalu dekat (&lt;200m), skor ditekan ke 15 poin untuk menghindari kanibalisasi layanan. Ditambah bonus densitas koridor (+8 poin jika &ge;5 halte dalam radius 800m).
                  </p>
                  <p>
                    <strong>B. Vitalitas Pejalan Kaki (Maks 35 poin):</strong> Dihitung dari jumlah POI aktif pada Struk Go &amp; Menu Go dalam radius 400m (&ge;15 POI bernilai 35 poin).
                  </p>
                  <p>
                    <strong>C. Zonasi RDTR (Maks 20 poin):</strong> Zona K1/K2/TR mendapatkan bobot penuh 20 poin, sedangkan hunian padat bernilai 12 poin.
                  </p>
                </div>
              </div>

              {/* Card 2: Friction Score & Bottleneck */}
              <div className="flex flex-col bg-white border border-[#C5C6CD] border-l-4 border-l-[#D9381E] shadow-xs rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-semibold uppercase text-[#D9381E] tracking-wider">Metrik 02</span>
                    <h3 className="text-xl font-bold text-[#1E293B]">Skor Friksi Perjalanan (Bottleneck)</h3>
                  </div>
                  <div className="p-2 bg-[#FEECEC] rounded-lg text-[#D9381E]">
                    <Route className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#F0EDEF] rounded-lg p-3 mb-3">
                  <div className="font-mono text-xs text-[#091426] font-semibold">
                    Friction = clamp(round(FirstMile/20 + LastMile/24) + P_transfer + P_flood, 10, 100)
                  </div>
                  <div className="text-[11px] font-mono text-[#5E626E] mt-1">
                    P_transfer = +25 (jika beda rute) | P_flood = +20 (jika rawan banjir)
                  </div>
                </div>

                <div className="text-xs text-[#45474C] space-y-2 leading-relaxed">
                  <p>
                    Mengukur tingkat kesulitan perjalanan harian warga dari Titik A ke Titik B berdasarkan beban fisik pejalan kaki dan diskontinuitas transit:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Kritis (Friction &ge; 65 atau Walk &gt; 750m):</strong> Aksesibilitas pedestrian sangat buruk, warga dipaksa berjalan jauh atau transit rumit.</li>
                    <li><strong>Sedang (Friction &ge; 40 atau Walk &gt; 480m atau Beda Koridor):</strong> Terdapat hambatan jalan kaki atau transit tidak langsung.</li>
                    <li><strong>Ringan / Optimal (Friction &lt; 40 dan Walk &le; 480m):</strong> Koridor sudah efisien dan memadai, <em>tidak memerlukan penambahan halte</em>.</li>
                  </ul>
                </div>
              </div>

              {/* Card 3: UMKM Vitality */}
              <div className="flex flex-col bg-white border border-[#C5C6CD] border-l-4 border-l-[#C27803] shadow-xs rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-semibold uppercase text-[#C27803] tracking-wider">Metrik 03</span>
                    <h3 className="text-xl font-bold text-[#1E293B]">Skor Vitalitas Ekonomi Mikro</h3>
                  </div>
                  <div className="p-2 bg-[#FEF6E7] rounded-lg text-[#C27803]">
                    <Store className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#F0EDEF] rounded-lg p-3 mb-3">
                  <div className="font-mono text-xs text-[#091426] font-semibold">
                    VitEcon = clamp(round(Trx_Struk * 0.15) + (InformalVendors * 2), 35, 96)
                  </div>
                  <div className="text-[11px] font-mono text-[#5E626E] mt-1">
                    Radius agregasi: 500 meter dari titik koordinat
                  </div>
                </div>

                <div className="text-xs text-[#45474C] space-y-2 leading-relaxed">
                  <p>
                    Model ini mengevaluasi sinergi simpul transit dengan perekonomian warga bawah. Parameter mencakup total transaksi belanja harian (Struk Go) dan kehadiran pedagang kaki lima / gerobak keliling (Menu Go).
                  </p>
                  <p>
                    Penempatan halte baru pada titik bervitalitas tinggi memicu terbentuknya <em>transit retail micro-hub</em> yang meningkatkan perputaran uang lokal tanpa mengorbankan kelancaran trotoar.
                  </p>
                </div>
              </div>

              {/* Card 4: 4-Tier Arterial Snapping */}
              <div className="flex flex-col bg-white border border-[#C5C6CD] border-l-4 border-l-[#166534] shadow-xs rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-semibold uppercase text-[#166534] tracking-wider">Mekanisme Spasial 04</span>
                    <h3 className="text-xl font-bold text-[#1E293B]">Anti-Gang Snapping Engine (4-Tier)</h3>
                  </div>
                  <div className="p-2 bg-[#EAFBF0] rounded-lg text-[#166534]">
                    <Compass className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#F0EDEF] rounded-lg p-3 mb-3">
                  <div className="font-mono text-xs text-[#091426] font-semibold">
                    ST_ClosestPoint(geom_arterial, point_pemukiman)
                  </div>
                  <div className="text-[11px] font-mono text-[#5E626E] mt-1">
                    Menjamin Halte Usulan 100% berada di jalan arteri, bukan gang sempit
                  </div>
                </div>

                <div className="text-xs text-[#45474C] space-y-1.5 leading-relaxed">
                  <p>
                    Ketika titik awal/akhir berada di tengah gang atau perumahan, algoritma secara ketat menarik rekomendasi halte ke jalan arteri terdekat:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li><strong>Tier 1 (Radius &le; 850m):</strong> PostGIS <code>ST_ClosestPoint</code> ke polyline koridor BRT utama (misal Jl. Rasuna Said, Jl. Sudirman).</li>
                    <li><strong>Tier 2 (Area Suburban &le; 1200m):</strong> Menarik ke halte eksisting di jalan arteri/kolektor (filter kata kunci: <em>Raya, Boulevard, Simpang</em>; anti-gang).</li>
                    <li><strong>Tier 3 (OSRM Verification):</strong> Validasi ruas jalan OSRM dengan eliminasi kelas <em>residential / alley</em>.</li>
                    <li><strong>Tier 4:</strong> Anchor ke sumbu halte resmi terdekat (<em>refStop</em>).</li>
                  </ol>
                </div>
              </div>

            </div>
          </section>

          {/* AI Orchestration Section */}
          <section className="flex flex-col gap-5 bg-white border border-[#C5C6CD] rounded-xl p-6 md:p-8 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#E8EDF9] rounded-xl text-[#1B4D89] flex-shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-[#091426]">
                  3. Peran AI Copilot &amp; Urban Planning Multi-Agent (RAG-Grounded)
                </h3>
                <p className="text-sm text-[#45474C] leading-relaxed">
                  LokaMaya menerapkan arsitektur AI yang <strong>bersifat deterministik murni di sisi kalkulasi</strong> dan <strong>bersifat sintetis naratif di sisi konsultasi</strong>. AI tidak pernah menebak-nebak angka atau memodifikasi hasil query spasial PostGIS.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="p-3.5 bg-[#F5F3F4] rounded-lg border border-[#E2E4EB]">
                    <div className="text-xs font-bold text-[#091426] mb-1">Tata Kota &amp; RDTR</div>
                    <div className="text-[11px] text-[#5E626E]">Memvalidasi batas koefisien dasar bangunan, zonasi K1/K2, dan kepatuhan Pergub DKI 31/2022.</div>
                  </div>
                  <div className="p-3.5 bg-[#F5F3F4] rounded-lg border border-[#E2E4EB]">
                    <div className="text-xs font-bold text-[#091426] mb-1">Analis Transit &amp; OD</div>
                    <div className="text-[11px] text-[#5E626E]">Menilai efisiensi transfer koridor, first/last-mile walk time, dan hierarki operasional bus.</div>
                  </div>
                  <div className="p-3.5 bg-[#F5F3F4] rounded-lg border border-[#E2E4EB]">
                    <div className="text-xs font-bold text-[#091426] mb-1">Ekonomi Kerakyatan</div>
                    <div className="text-[11px] text-[#5E626E]">Menganalisis dampak penempatan halte pada peningkatan omzet pedagang kaki lima &amp; warung.</div>
                  </div>
                  <div className="p-3.5 bg-[#F5F3F4] rounded-lg border border-[#E2E4EB]">
                    <div className="text-xs font-bold text-[#091426] mb-1">Mitigasi Kebencanaan</div>
                    <div className="text-[11px] text-[#5E626E]">Memastikan lokasi halte bebas dari ancaman genangan air dan tanggap evakuasi banjir.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CRITICAL: Known Limitations Section */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FEECEC] rounded-lg text-[#D9381E]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#091426]">4. Keterbatasan Sistem &amp; Asumsi Pemodelan (Known Limitations)</h2>
                <p className="text-xs text-[#5E626E]">Batasan operasional dan asumsi analitik yang perlu dipahami oleh perencana kota dan pengambil kebijakan.</p>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* Limitation 1 */}
              <div className="flex gap-4 p-5 bg-white border border-[#E2E4EB] border-l-4 border-l-[#C27803] rounded-xl shadow-xs">
                <AlertTriangle className="w-5 h-5 text-[#C27803] flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-[#091426]">
                    1. Ketiadaan Telemetri Real-Time GPS Armada (Static Headway &amp; Transit Speed Assumption)
                  </h4>
                  <p className="text-xs text-[#45474C] leading-relaxed">
                    Waktu tempuh busway dihitung menggunakan kecepatan operasional rata-rata TransJakarta (~18–25 km/jam) dan estimasi <i>headway</i> standar antar-armada (8–15 menit). Platform saat ini <strong>belum terhubung secara langsung ke feed telemetri GPS live (GTFS-Realtime)</strong> per detik armada bus. Akibatnya, keterlambatan mendadak akibat kemacetan insidental di luar jalur busway steril atau antrean armada di halte transit padat belum dimodelkan secara dinamis saat simulasi berlangsung.
                  </p>
                </div>
              </div>

              {/* Limitation 2 */}
              <div className="flex gap-4 p-5 bg-white border border-[#E2E4EB] border-l-4 border-l-[#C27803] rounded-xl shadow-xs">
                <AlertTriangle className="w-5 h-5 text-[#C27803] flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-[#091426]">
                    2. Variasi Kerapatan Data MAPID di Kawasan Suburban (Fringe Sparsity)
                  </h4>
                  <p className="text-xs text-[#45474C] leading-relaxed">
                    Data UMKM (Struk Go &amp; Menu Go) dan Community Maps memiliki tingkat kerapatan yang sangat tinggi di kawasan pusat aktivitas (Jakarta Pusat, Jakarta Selatan, dan koridor arteri primer), namun cenderung lebih jarang (<em>sparse</em>) di wilayah perbatasan suburban luar (seperti pinggiran Jakarta Timur atau Jakarta Barat terluar). Pada titik yang tidak memiliki data transaksi fisik, model menggunakan fungsi estimasi deterministik terstandarisasi untuk menjaga keutuhan simulasi.
                  </p>
                </div>
              </div>

              {/* Limitation 3 */}
              <div className="flex gap-4 p-5 bg-white border border-[#E2E4EB] border-l-4 border-l-[#C27803] rounded-xl shadow-xs">
                <AlertTriangle className="w-5 h-5 text-[#C27803] flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-[#091426]">
                    3. Ketergantungan pada Tagging Hierarki Jalan OpenStreetMap (OSM)
                  </h4>
                  <p className="text-xs text-[#45474C] leading-relaxed">
                    Mesin <em>Arterial Snapping</em> mengandalkan klasifikasi jalan OSM (<code>highway=primary</code>, <code>secondary</code>, <code>trunk</code>). Pada segmen tertentu di Jakarta di mana komunitas OSM belum memperbarui tag hierarki jalan atau terdapat inkonsistensi penamaan jalan sekunder/kolektor, sistem mengandalkan lapisan cadangan (Tier 2 &amp; Tier 4) untuk menambatkan halte ke sumbu jaringan halte resmi terdekat.
                  </p>
                </div>
              </div>

              {/* Limitation 4 */}
              <div className="flex gap-4 p-5 bg-white border border-[#E2E4EB] border-l-4 border-l-[#C27803] rounded-xl shadow-xs">
                <AlertTriangle className="w-5 h-5 text-[#C27803] flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-[#091426]">
                    4. Hambatan Mikro-Pedestrian Fisik yang Belum Terpetakan
                  </h4>
                  <p className="text-xs text-[#45474C] leading-relaxed">
                    Model jarak jalan kaki mengasumsikan pejalan kaki sehat dengan kecepatan standar 75 meter/menit (4,5 km/jam) mengikuti trotoar dan jalan lokal OSM. Hambatan mikro temporer seperti galian utilitas jalan, trotoar rusak yang terhalang parkir liar, atau ketiadaan eskalator/lift pada JPO tertentu belum dihitung sebagai penalti waktu mikro.
                  </p>
                </div>
              </div>

              {/* Limitation 5 */}
              <div className="flex gap-4 p-5 bg-white border border-[#E2E4EB] border-l-4 border-l-[#C27803] rounded-xl shadow-xs">
                <AlertTriangle className="w-5 h-5 text-[#C27803] flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-[#091426]">
                    5. Mekanisme Fallback Dual-Engine Routing
                  </h4>
                  <p className="text-xs text-[#45474C] leading-relaxed">
                    Sistem mengutamakan komputasi rute jalan kaki dan transit melalui container microservice OSRM lokal. Jika engine lokal mengalami kendala latensi atau <em>timeout</em> (&gt;2 detik), sistem menerapkan <em>graceful fallback</em> ke pendekatan interpolasi kurva arteri dan Manhattan Grid guna memastikan antarmuka tetap responsif bagi pengguna tanpa mengalami <em>blank error</em>.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Bottom CTA */}
          <section className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-gradient-to-r from-[#091426] to-[#1E293B] text-white rounded-2xl shadow-md">
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <h3 className="text-xl font-bold">Uji Coba Langsung di Simulator Interaktif</h3>
              <p className="text-sm text-gray-300">Lihat bagaimana formula spasial dan AI Multi-Agent mengevaluasi rute dan merekomendasikan halte secara real-time.</p>
            </div>
            <Link 
              href="/peta-simulasi" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D9381E] hover:bg-[#b82e18] text-white text-sm font-semibold rounded-lg shadow transition-all flex-shrink-0"
            >
              <span>Buka Peta Simulasi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>

        </div>
      </main>
    </div>
  );
}

