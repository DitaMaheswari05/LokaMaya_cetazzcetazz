import Image from "next/image";
import Link from "next/link";
import { Navigation, BarChart3, Route, ArrowLeftRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-background">
      {/* AppNavbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-10 h-16 bg-white/95 border-b border-border-light shadow-sm backdrop-blur-md">
        <div className="flex-shrink-0">
          <Image
            src="/lokamaya_recolored.png"
            alt="LokaMaya Logo"
            width={139}
            height={49.72}
            className="h-[49.72px] w-auto"
            priority
          />
        </div>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
          <Link href="/" className="px-4 py-1.5 text-[13px] font-medium text-text-gray hover:text-text-dark hover:bg-gray-100 rounded-lg transition">
            Beranda
          </Link>
          <Link href="/peta-simulasi" className="px-4 py-1.5 text-[13px] font-medium text-text-gray hover:text-text-dark hover:bg-gray-100 rounded-lg transition">
            Peta Simulasi
          </Link>
          <Link href="/metodologi" className="px-4 py-1.5 text-[13px] font-medium text-text-gray hover:text-text-dark hover:bg-gray-100 rounded-lg transition">
            Metodologi
          </Link>
        </div>

        <div className="flex-shrink-0">
          <Link href="/login" className="inline-block px-[18px] py-[7px] bg-accent text-white font-semibold text-sm rounded-[10px] shadow-[0_2px_8px_rgba(45,42,112,0.2)] hover:bg-[#d85e1b] transition">
            Masuk
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full bg-primary overflow-hidden min-h-[700px] flex items-center pt-16">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-10 pointer-events-none" />
        <div className="absolute right-0 top-0 w-[380px] h-[380px] bg-accent opacity-10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute left-[-48px] top-[526px] w-[240px] h-[240px] bg-accent opacity-[0.06] blur-[60px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 md:px-12 max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center h-full">
          {/* Left Content */}
          <div className="flex flex-col items-start pb-20 mt-10 lg:mt-0">
            <div className="flex items-center gap-2 px-3.5 py-1 mb-6 bg-white/10 border border-white/20 rounded-full">
              <span className="w-1.5 h-1.5 bg-accent rounded-full" />
              <span className="text-[11px] font-medium tracking-[0.66px] uppercase text-white/70">
                WEBGIS SIMULATOR
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-[54px] leading-tight lg:leading-[59px] font-bold text-white max-w-[560px] mb-5">
              Temukan Titik Halte Paling Strategis
            </h1>
            
            <p className="text-base leading-7 text-white/60 max-w-[480px] mb-9">
              Simulasikan dampak penempatan atau pemindahan halte TransJakarta hanya dalam hitungan detik. Analisis jangkauan warga, kepadatan UMKM, konektivitas rute, hingga kelayakan lokasi secara instan.
            </p>
            
            <div className="flex flex-wrap gap-3 mb-12 w-full max-w-[600px]">
              <Link href="/peta-simulasi" className="px-7 py-3 bg-accent text-white font-semibold text-sm rounded-xl shadow-[0_4px_20px_rgba(237,107,35,0.35)] hover:bg-[#d85e1b] transition inline-flex items-center justify-center">
                Mulai Simulasi
              </Link>
              <Link href="/metodologi" className="px-7 py-3 bg-white/10 text-white/80 font-medium text-sm rounded-xl border border-white/20 hover:bg-white/20 transition inline-flex items-center justify-center">
                Lihat Metodologi
              </Link>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-10 pt-12 border-t border-white/10 w-full max-w-[600px]">
              <div>
                <h3 className="text-[26px] leading-[39px] font-bold text-white">412</h3>
                <p className="text-xs text-white/50">Halte terpetakan</p>
              </div>
              <div>
                <h3 className="text-[26px] leading-[39px] font-bold text-white">8.240</h3>
                <p className="text-xs text-white/50">UMKM ter-mapping</p>
              </div>
              <div>
                <h3 className="text-[26px] leading-[39px] font-bold text-white">1.370</h3>
                <p className="text-xs text-white/50">Simulasi dijalankan</p>
              </div>
            </div>
          </div>

          {/* Right Content / Map Graphic */}
          <div className="relative w-full h-[380px] lg:h-[450px] bg-[#1E1E3A] border border-white/10 rounded-t-2xl shadow-2xl overflow-hidden mt-10 lg:mt-0 lg:self-end">
            <Image
              src="/map.png"
              alt="Map Simulator Graphic"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Map Overlay Stats Widget */}
            <div className="absolute bottom-6 left-4 lg:left-6 flex flex-col p-3 bg-[#1E1E3A]/85 border border-white/10 backdrop-blur-md rounded-xl shadow-lg w-[230px]">
              <span className="text-[10px] text-white/50 mb-1">Halte Manggarai - Simulasi</span>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <span className="text-accent">Akses 78</span>
                <span className="text-white/20 text-base leading-none">&middot;</span>
                <span className="text-green-400">UMKM 52</span>
                <span className="text-white/20 text-base leading-none">&middot;</span>
                <span className="text-yellow-400">Bersyarat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-12 bg-background flex justify-center w-full relative z-10">
        <div className="max-w-7xl w-full">
          <div className="mb-12">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#141332] to-[#3D3A98] mb-2">
              Fitur Utama
            </h2>
            <p className="text-sm text-text-gray max-w-[700px]">
              Semua yang dibutuhkan untuk menganalisis dan mensimulasikan penempatan halte TransJakarta.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border border-border-light shadow-[0_1px_3px_rgba(45,42,112,0.04)] rounded-[18px] p-7 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 text-accent">
                <Navigation size={22} className="opacity-80" />
              </div>
              <h3 className="text-sm font-semibold text-text-dark mb-2">Jangkauan Jalan Kaki</h3>
              <p className="text-xs text-text-gray leading-[1.6]">
                Visualisasi area jangkauan 5–10 menit berjalan kaki dari titik simulasi.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-border-light shadow-[0_1px_3px_rgba(45,42,112,0.04)] rounded-[18px] p-7 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 text-accent">
                <BarChart3 size={22} className="opacity-80" />
              </div>
              <h3 className="text-sm font-semibold text-text-dark mb-2">Skor Multi-dimensi</h3>
              <p className="text-xs text-text-gray leading-[1.6]">
                Akses jalan kaki, ekonomi UMKM, dan kelayakan lokasi dalam satu angka 0-100.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-border-light shadow-[0_1px_3px_rgba(45,42,112,0.04)] rounded-[18px] p-7 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 text-accent">
                <Route size={22} className="opacity-80" />
              </div>
              <h3 className="text-sm font-semibold text-text-dark mb-2">Konektivitas Rute</h3>
              <p className="text-xs text-text-gray leading-[1.6]">
                Identifikasi rute TransJakarta yang terpengaruh saat halte dipindah atau ditambah.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-border-light shadow-[0_1px_3px_rgba(45,42,112,0.04)] rounded-[18px] p-7 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 text-accent">
                <ArrowLeftRight size={22} className="opacity-80" />
              </div>
              <h3 className="text-sm font-semibold text-text-dark mb-2">Perbandingan Skenario</h3>
              <p className="text-xs text-text-gray leading-[1.6]">
                Bandingkan dua lokasi side-by-side untuk keputusan penempatan halte terbaik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Image Section */}
      <section className="relative w-full overflow-hidden mt-auto bg-background">
        <div className="w-full relative min-h-[300px] md:min-h-[424px]">
          <Image
            src="/welcome_page.png"
            alt="LokaMaya Welcome Illustration"
            fill
            className="object-cover object-bottom"
          />
        </div>
      </section>
    </div>
  );
}
