"use client";
import React from 'react';
import Navbar from '@/components/Navbar';
import { Database, Sigma, Store, Bot, PersonStanding } from 'lucide-react';

export default function MetodologiPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FBF8FA] font-sans overflow-x-hidden">
      <Navbar />

      <main className="flex flex-col items-center w-full px-4 md:px-8 py-12 md:py-24">
        <div className="flex flex-col gap-16 w-full max-w-5xl">
          
          {/* Header Section */}
          <section className="flex flex-col gap-4 max-w-3xl">
            <h1 className="text-3xl md:text-[32px] font-semibold text-[#091426] leading-tight tracking-tight">
              Metodologi & Sumber Data
            </h1>
            <p className="text-base text-[#45474C] leading-[26px]">
              Transparansi adalah inti dari Lokamaya. Kami percaya bahwa keputusan perencanaan kota yang berdampak harus didasarkan pada data yang dapat diverifikasi dan model matematis yang kuat. Halaman ini merinci dataset inti yang menggerakkan simulasi kami dan logika di balik metrik penilaian utama.
            </p>
          </section>

          {/* Dataset Table Section */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-[#515F74]" />
              <h2 className="text-2xl font-semibold text-[#091426]">Katalog Dataset Utama</h2>
            </div>
            
            <div className="w-full bg-white border border-[#C5C6CD] rounded-lg shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#F5F3F4] border-b border-[#C5C6CD]">
                    <th className="py-4 px-6 font-mono font-medium text-xs text-[#45474C] uppercase tracking-wider w-[20%]">Nama Dataset</th>
                    <th className="py-4 px-6 font-mono font-medium text-xs text-[#45474C] uppercase tracking-wider w-[25%]">Sumber</th>
                    <th className="py-4 px-6 font-mono font-medium text-xs text-[#45474C] uppercase tracking-wider w-[55%]">Fungsi dalam Simulasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C5C6CD]">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-[#091426]">GTFS TransJakarta</td>
                    <td className="py-4 px-6 text-sm text-[#45474C]">PT Transportasi Jakarta</td>
                    <td className="py-4 px-6 text-sm text-[#1B1B1D]">Routing transit, perhitungan aksesibilitas halte, dan frekuensi layanan.</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-[#091426]">Community Maps</td>
                    <td className="py-4 px-6 text-sm text-[#45474C]">OpenStreetMap & Relawan</td>
                    <td className="py-4 px-6 text-sm text-[#1B1B1D]">Data infrastruktur pejalan kaki, trotoar, hambatan jalan, dan POI lokal.</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-[#091426]">UMKM Heatmap</td>
                    <td className="py-4 px-6 text-sm text-[#45474C]">Internal / Partner Data</td>
                    <td className="py-4 px-6 text-sm text-[#1B1B1D]">Indikator vitalitas ekonomi mikro, kepadatan komersial, dan peluang kerja.</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-[#091426]">RDTR DKI Jakarta</td>
                    <td className="py-4 px-6 text-sm text-[#45474C]">Dinas Cipta Karya</td>
                    <td className="py-4 px-6 text-sm text-[#1B1B1D]">Validasi zonasi, aturan tata ruang, dan batas pengembangan kawasan.</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-[#091426]">Flood Risk Map</td>
                    <td className="py-4 px-6 text-sm text-[#45474C]">BPBD DKI</td>
                    <td className="py-4 px-6 text-sm text-[#1B1B1D]">Faktor pengurang (penalty) dalam skor keamanan lingkungan dan ketahanan iklim.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Scoring Formulas Section */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Sigma className="w-5 h-5 text-[#515F74]" />
              <h2 className="text-2xl font-semibold text-[#091426]">Logika Pemodelan (Scoring Formulas)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="flex flex-col bg-white border border-[#C5C6CD] border-l-4 shadow-sm rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-semibold text-[#1E293B]">Akses Jalan Kaki</h3>
                  <div className="p-2 bg-[#D5E3FD] rounded text-[#515F74]">
                    <PersonStanding className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-[#F0EDEF] rounded-md p-3 mb-4 overflow-x-auto">
                  <code className="font-mono text-xs text-[#45474C] whitespace-nowrap">
                    Score = Σ(Pop * Weight(Isochrone)) / Total_Pop
                  </code>
                </div>
                <p className="text-sm text-[#45474C] leading-relaxed">
                  Metrik ini mengukur keterjangkauan berbasis waktu. Sistem menghasilkan isochrone (area tangkapan) berjalan kaki 5, 10, dan 15 menit dari titik transit atau fasilitas umum. Nilai tersebut kemudian dibobotkan terhadap data kepadatan penduduk (Pop) untuk memastikan fasilitas melayani jumlah warga yang optimal.
                </p>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col bg-white border border-[#C5C6CD] border-l-4 shadow-sm rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-semibold text-[#1E293B]">Vitalitas Ekonomi</h3>
                  <div className="p-2 bg-[#FADFB8] rounded text-[#A38C6A]">
                    <Store className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-[#F0EDEF] rounded-md p-3 mb-4 overflow-x-auto">
                  <code className="font-mono text-xs text-[#45474C] whitespace-nowrap">
                    VitEcon = (UMKM_Dens * w1) + (Transit_Prox * w2)
                  </code>
                </div>
                <p className="text-sm text-[#45474C] leading-relaxed">
                  Vitalitas ekonomi dihitung dengan menggabungkan kepadatan Usaha Mikro Kecil dan Menengah (UMKM) dalam suatu area binaan, dipadukan dengan proksimitas ke simpul transportasi massal. Model ini mengasumsikan bahwa pergerakan pejalan kaki dari transit mendorong pertumbuhan ritel lokal.
                </p>
              </div>
            </div>
          </section>

          {/* AI Disclaimer Section */}
          <section className="flex flex-col sm:flex-row items-start gap-4 p-6 md:p-8 bg-[#BCC7DE]/20 border border-[#D8E3FB] rounded-lg shadow-sm">
            <div className="mt-1 flex-shrink-0">
              <Bot className="w-6 h-6 text-[#091426]" />
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-base font-semibold text-[#091426]">Catatan Sistem AI Assistant</h4>
              <p className="text-sm text-[#45474C] leading-relaxed">
                Model Bahasa Buatan (AI Assistant) dalam Lokamaya berfungsi sebagai interpreter naratif. AI bertugas menyajikan data mentah dan hasil simulasi menjadi bahasa yang mudah dipahami (Natural Language Generation). AI tidak mengubah, memodifikasi, atau memanipulasi model matematis deterministik maupun data mentah yang mendasarinya. Seluruh keputusan simulasi tetap berpijak pada data empiris.
              </p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
