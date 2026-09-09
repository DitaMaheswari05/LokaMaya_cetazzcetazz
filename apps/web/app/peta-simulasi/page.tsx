"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';
import { apiClient } from '@/lib/api/client';
import { SimulationResult } from '@/types/api';
import { Search, Menu, Loader2, MapPin, Sparkles, X, CheckCircle, AlertTriangle } from 'lucide-react';

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
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

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

  const handleMapClick = (evt: { lngLat: { lng: number; lat: number } }) => {
    setSelectedLocation({
      latitude: evt.lngLat.lat,
      longitude: evt.lngLat.lng,
    });
  };

  const handleRunSimulation = async () => {
    if (!selectedLocation) {
      alert("Silakan klik lokasi di peta terlebih dahulu untuk menentukan titik simulasi halte.");
      return;
    }

    setIsSimulating(true);
    try {
      const result = await apiClient.simulateStop({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        scenario_type: mapMode === 'add' ? 'tambah' : 'pindah',
        stop_name: `Halte Usulan (${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)})`,
      });
      setSimulationResult(result);
    } catch (err: any) {
      alert(`Error simulasi: ${err.message || 'Gagal menjalankan simulasi'}`);
    } finally {
      setIsSimulating(false);
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
            selectedLocation={selectedLocation}
            onClick={handleMapClick}
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
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="px-5 py-[8px] bg-[#ED6B23] text-white text-[13px] font-semibold rounded-[10px] shadow-sm hover:bg-[#d65f1e] disabled:opacity-50 transition-colors whitespace-nowrap hidden sm:flex items-center gap-1.5 cursor-pointer"
            >
              {isSimulating && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
              {isSimulating ? 'Menganalisis...' : 'Jalankan Simulasi'}
            </button>
          </div>

          {/* Mobile Jalankan Simulasi Button - Floating bottom */}
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="sm:hidden absolute bottom-24 left-1/2 -translate-x-1/2 z-10 px-6 py-[10px] bg-[#ED6B23] text-white text-[13px] font-semibold rounded-[10px] shadow-md hover:bg-[#d65f1e] disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-2"
          >
            {isSimulating && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
            {isSimulating ? 'Menganalisis...' : 'Jalankan Simulasi'}
          </button>

          {/* Center Info Overlay */}
          <div className="absolute top-24 sm:top-6 left-1/2 -translate-x-1/2 z-10 bg-[#1E1E3A]/85 backdrop-blur-[8px] border border-white/10 rounded-[14px] px-6 py-2.5 flex flex-col items-center shadow-lg pointer-events-none text-center">
            <span className="text-white text-[13px] font-semibold leading-[18px]">
              {selectedLocation
                ? `Titik terpilih: ${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
                : (mapMode === 'add' ? 'Klik peta untuk memilih titik halte baru' : 'Pilih dan geser halte di peta')}
            </span>
            <span className="text-white/50 text-[11px] leading-[15px] mt-[2px]">
              {selectedLocation ? 'Klik "Jalankan Simulasi" untuk analisis AI spasial' : 'atau tanya AI di pojok kanan bawah'}
            </span>
          </div>

          {/* Simulation Result Overlay Modal */}
          {simulationResult && (
            <div className="absolute top-20 left-4 sm:left-6 z-20 w-[calc(100vw-32px)] sm:w-[380px] max-h-[calc(100vh-160px)] overflow-y-auto bg-white/95 backdrop-blur-md border border-[#E2E2EF] shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E2EF]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#2D2A70] flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4 text-[#ED6B23]" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-[#1A1832] leading-tight">
                      {simulationResult.stop_name || 'Hasil Simulasi Halte'}
                    </h3>
                    <span className="text-[10px] font-medium text-[#6B6B8F] uppercase tracking-wide">
                      Skenario: {simulationResult.scenario_type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSimulationResult(null)}
                  className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#6B6B8F] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-[#F4F4FA] p-2.5 rounded-xl flex flex-col">
                  <span className="text-[10px] text-[#6B6B8F] font-medium">Walk Accessibility</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-[20px] font-bold text-[#2D2A70]">
                      {simulationResult.walk_accessibility?.score ?? '-'}
                    </span>
                    <span className="text-[10px] text-[#6B6B8F]">/100</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#139A73] capitalize mt-0.5">
                    {simulationResult.walk_accessibility?.category ?? '-'}
                  </span>
                </div>

                <div className="bg-[#F4F4FA] p-2.5 rounded-xl flex flex-col">
                  <span className="text-[10px] text-[#6B6B8F] font-medium">Ekonomi UMKM</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-[20px] font-bold text-[#B95829]">
                      {simulationResult.umkm_economic?.score ?? '-'}
                    </span>
                    <span className="text-[10px] text-[#6B6B8F]">/100</span>
                  </div>
                  <span className="text-[10px] text-[#6B6B8F] mt-0.5">
                    {simulationResult.umkm_economic?.struk_go_transactions ?? 0} tx / {simulationResult.umkm_economic?.informal_vendor_count ?? 0} informal
                  </span>
                </div>
              </div>

              {/* Feasibility & RDTR */}
              <div className="bg-[#F8F8FC] border border-[#E2E2EF] rounded-xl p-2.5 mt-2 flex flex-col gap-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B6B8F]">Kesesuaian RDTR:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                    simulationResult.site_feasibility?.status === 'Sesuai'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {simulationResult.site_feasibility?.status ?? 'Sesuai'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#6B6B8F]">
                  <span>Risiko Banjir:</span>
                  <span className="font-medium text-[#1A1832]">{simulationResult.site_feasibility?.flood_risk ?? 'Rendah'}</span>
                </div>
              </div>

              {/* AI Narrative */}
              <div className="mt-3 bg-[#2D2A70]/5 border border-[#2D2A70]/15 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1 text-[#2D2A70] font-semibold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-[#ED6B23]" />
                  <span>Analisis AI LokaMaya</span>
                </div>
                <p className="text-[11px] text-[#1A1832] leading-relaxed">
                  {simulationResult.ai_narrative || 'Analisis dampak spasial dan konektivitas rute telah berhasil dikalkulasi.'}
                </p>
              </div>
            </div>
          )}

          {/* Bottom Right AI Button & Widget */}
          <ChatWidget
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            contextLocation={selectedLocation ? {
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              stop_name: `Halte Usulan (${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)})`,
            } : null}
            onSimulationTriggered={(sim) => setSimulationResult(sim)}
          />
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="absolute bottom-6 right-4 sm:right-6 z-20 w-[48px] h-[48px] bg-[#2D2A70] rounded-[14px] shadow-[0px_4px_16px_rgba(45,42,112,0.35)] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
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
