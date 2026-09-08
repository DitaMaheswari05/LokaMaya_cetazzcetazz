"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';
import { Search, Menu, Loader2 } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 w-full h-full bg-[#1E1E3A] animate-pulse z-0" />
});

const LAYERS = [
  { id: 'transjakarta', name: 'Halte TransJakarta', color: '#2D2A70', defaultActive: true },
  { id: 'community', name: 'Community Maps', color: '#7C3AED', defaultActive: false },
  { id: 'umkm', name: 'UMKM (Struk/Menu Go)', color: '#B95829', defaultActive: false },
  { id: 'rawan_banjir', name: 'Rawan Banjir', color: '#4184C9', defaultActive: false },
  { id: 'rdtr', name: 'RDTR', color: '#4E5167', defaultActive: false },
  { id: 'rute', name: 'Rute Terhubung', color: '#139A73', defaultActive: false },
];

export default function PetaSimulasiPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mapMode, setMapMode] = useState<'add' | 'move'>('add');
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    LAYERS.forEach(l => init[l.id] = l.defaultActive);
    return init;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [targetLocation, setTargetLocation] = useState<{ latitude: number, longitude: number, zoom?: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-[#F4F4FA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2D2A70]" />
      </div>
    );
  }

  const toggleLayer = (id: string) => {
    setActiveLayers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // Cek apakah input berupa koordinat "lat, lng" atau "lat lng"
    const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);

    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setTargetLocation({ latitude: lat, longitude: lng, zoom: 15 });
        setIsSearching(false);
        return;
      }
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setTargetLocation({ latitude: lat, longitude: lng, zoom: 15 });
      } else {
        alert("Lokasi tidak ditemukan");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Terjadi kesalahan saat mencari lokasi");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen bg-[#F4F4FA] overflow-hidden relative">
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative w-full h-full">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-[280px] md:w-[220px] translate-x-0' : 'w-[280px] md:w-[220px] -translate-x-full md:translate-x-0 md:w-0'} transition-all duration-300 flex-shrink-0 bg-white border-r border-[#E2E2EF] flex flex-col z-20 absolute md:relative h-full`}>
          <div className="flex flex-col flex-1 py-3 px-2 overflow-y-auto">
            <div className="px-3 pb-2 pt-1">
              <span className="text-[10px] font-semibold text-[#6B6B8F] tracking-[0.6px] uppercase">
                Layer CONTROL
              </span>
            </div>

            <div className="flex flex-col gap-1 mt-1">
              {LAYERS.map(layer => (
                <div key={layer.id} className="flex items-center justify-between px-3 py-2 rounded-[10px] hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-[14px] h-[14px] rounded-full" style={{ backgroundColor: layer.color }}></div>
                    <span className="text-[11px] font-medium text-[#1A1832] leading-[14px]">{layer.name}</span>
                  </div>
                  <div
                    onClick={() => toggleLayer(layer.id)}
                    className={`w-8 h-[18px] rounded-full p-[3px] flex items-center cursor-pointer transition-colors ${activeLayers[layer.id] ? 'justify-end' : 'bg-[#D1D5DB] justify-start'}`}
                    style={{ backgroundColor: activeLayers[layer.id] ? layer.color : '#D1D5DB' }}
                  >
                    <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legenda */}
          <div className="border-t border-[#E2E2EF] py-3 px-3">
            <span className="text-[9px] font-semibold text-[#6B6B8F] tracking-[0.54px] uppercase px-1">
              Legenda
            </span>
            <div className="flex flex-col gap-2 mt-2 px-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-[2px] bg-[#ED6B23]"></div>
                <span className="text-[10px] text-[#6B6B8F]">Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-[1.2px] border-t-[1.2px] border-dashed border-[#ED6B23]"></div>
                <span className="text-[10px] text-[#6B6B8F]">Estimasi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Toggle Overlay */}
        {isSidebarOpen && (
          <div
            className="absolute inset-0 bg-black/20 z-10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Map Area */}
        <div className="flex-1 relative flex flex-col w-full h-full overflow-hidden">

          <MapComponent
            className="absolute inset-0 w-full h-full z-0"
            styleName="street-v2.0"
            targetLocation={targetLocation}
          />

          {/* Top Control - Left (Mobile toggle + Buttons) */}
          <div className="absolute top-4 left-4 md:left-6 z-10 flex items-center gap-3">
            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-[#2D2A70]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="bg-[#F0F0F5] p-1 rounded-xl flex items-center gap-1 shadow-md">
              <button
                onClick={() => setMapMode('add')}
                className={`px-4 py-1.5 text-[12px] font-semibold rounded-[9px] transition-colors ${mapMode === 'add' ? 'bg-[#2D2A70] text-white shadow-sm' : 'text-[#6B6B8F] hover:bg-white/50'}`}
              >
                Tambah Halte Baru
              </button>
              <button
                onClick={() => setMapMode('move')}
                className={`px-4 py-1.5 text-[12px] font-semibold rounded-[9px] transition-colors hidden sm:block ${mapMode === 'move' ? 'bg-[#2D2A70] text-white shadow-sm' : 'text-[#6B6B8F] hover:bg-white/50'}`}
              >
                Pindahkan Halte
              </button>
            </div>
          </div>

          {/* Top Control - Right (Search + Button) */}
          <div className="absolute top-4 right-4 md:right-6 z-10 flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center bg-[#F4F4FA] border border-[#E2E2EF] rounded-xl px-3 py-[7px] w-[200px] sm:w-[270px] shadow-sm">
              <Search className="w-3.5 h-3.5 text-[#9999BF] mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari alamat atau koordinat..."
                className="bg-transparent border-none outline-none text-[12px] w-full text-[#1A1832] placeholder:text-[#1A1832]/50"
                disabled={isSearching}
              />
              {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9999BF] ml-2" />}
            </form>
            <button className="px-6 py-[8px] bg-[#ED6B23] text-white text-[13px] font-semibold rounded-[10px] shadow-sm hover:bg-[#d65f1e] transition-colors whitespace-nowrap hidden sm:block">
              Jalankan Simulasi
            </button>
          </div>

          {/* Mobile Jalankan Simulasi Button - Floating bottom */}
          <button className="sm:hidden absolute bottom-24 left-1/2 -translate-x-1/2 z-10 px-6 py-[10px] bg-[#ED6B23] text-white text-[13px] font-semibold rounded-[10px] shadow-md hover:bg-[#d65f1e] transition-colors whitespace-nowrap">
            Jalankan Simulasi
          </button>

          {/* Center Info Overlay */}
          <div className="absolute top-24 sm:top-6 left-1/2 -translate-x-1/2 z-10 bg-[#1E1E3A]/85 backdrop-blur-[8px] border border-white/10 rounded-[14px] px-6 py-4 flex flex-col items-center shadow-lg pointer-events-none">
            <span className="text-white text-[14px] font-semibold leading-[21px]">
              {mapMode === 'add' ? 'Klik peta untuk mulai' : 'Pilih dan geser halte di peta'}
            </span>
            <span className="text-white/45 text-[12px] leading-[18px] mt-[4px]">atau tanya AI di bawah kanan</span>
          </div>

          {/* Bottom Right AI Button & Widget */}
          <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="absolute bottom-6 right-4 sm:right-6 z-20 w-[48px] h-[48px] bg-[#2D2A70] rounded-[14px] shadow-[0px_4px_16px_rgba(45,42,112,0.35)] flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Menu className="w-[20px] h-[20px] text-white" />
            <div className="absolute -top-[4px] -right-[4px] min-w-[18px] h-[18px] bg-[#ED6B23] rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1 border-[1.8px] border-[#1E1E3A] z-30">
              AI
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
