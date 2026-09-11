"use client";
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';
import { apiClient } from '@/lib/api/client';
import { SimulationResult, OptimalStopCandidate, ODLocation, ODTripAnalysisResult } from '@/types/api';
import { RouteComparisonCard } from '@/components/RouteComparisonCard';
import { UrbanCouncilCard } from '@/components/UrbanCouncilCard';
import { PolicyBriefModal } from '@/components/PolicyBriefModal';
import { BehavioralRippleCard } from '@/components/BehavioralRippleCard';
import { Search, Menu, Loader2, MapPin, Sparkles, X, CheckCircle, AlertTriangle, FileText, Compass, Users, Activity, Sparkle, Minus, ChevronUp, Bus, Filter, Layers, ArrowRightLeft, Navigation, Zap } from 'lucide-react';

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
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | null>(null);
  const [originLocation, setOriginLocation] = useState<ODLocation | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<ODLocation | null>(null);
  const [odTripResult, setOdTripResult] = useState<ODTripAnalysisResult | null>(null);
  const [isAnalyzingOD, setIsAnalyzingOD] = useState(false);
  const [tripPickTarget, setTripPickTarget] = useState<'origin' | 'destination' | null>(null);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    LAYERS.forEach(l => init[l.id] = l.defaultActive);
    return init;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [targetLocation, setTargetLocation] = useState<{ latitude: number; longitude: number; zoom?: number; pitch?: number; bearing?: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedRouteCode, setSelectedRouteCode] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulationMinimized, setIsSimulationMinimized] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [layersData, setLayersData] = useState<Record<string, any>>({});
  const [isochroneData, setIsochroneData] = useState<any | null>(null);

  // Filter jenis halte (BRT Utama, Semua Halte, Feeder Non-BRT)
  type StopFilterType = 'brt' | 'all' | 'feeder';
  const [stopFilter, setStopFilter] = useState<StopFilterType>('brt');
  const [filterByRoute, setFilterByRoute] = useState<boolean>(false);
  const [selectedStop, setSelectedStop] = useState<any | null>(null);

  // Komputasi layer halte terfilter secara reaktif
  const filteredTransjakartaData = useMemo(() => {
    const raw = layersData?.transjakarta;
    if (!raw || !raw.features) return raw;

    let features = raw.features;

    // 1. Filter tipe halte
    if (stopFilter === 'brt') {
      features = features.filter((f: any) => f.properties?.is_brt === true || f.properties?.sub_type === 'brt');
    } else if (stopFilter === 'feeder') {
      features = features.filter((f: any) => !f.properties?.is_brt);
    }

    // 2. Filter fokus rute terpilih
    if (filterByRoute && selectedRouteCode) {
      features = features.filter((f: any) => {
        let routes = f.properties?.routes;
        if (typeof routes === 'string') {
          try { routes = JSON.parse(routes); } catch { routes = []; }
        }
        if (!Array.isArray(routes)) routes = [];

        const routeCodes = (f.properties?.route_codes || '').split(',').map((s: string) => s.trim());
        return (
          routes.some((r: any) => r.code === selectedRouteCode || r.corridor === selectedRouteCode) ||
          routeCodes.includes(selectedRouteCode) ||
          (f.properties?.corridor && f.properties.corridor.includes(selectedRouteCode))
        );
      });
    }

    return {
      ...raw,
      features,
    };
  }, [layersData?.transjakarta, stopFilter, filterByRoute, selectedRouteCode]);

  // Daftar koridor & rute unik dan terurut untuk dropdown filter rute (bebas duplicate key)
  const availableRoutes = useMemo(() => {
    const rawFeatures = layersData?.rute?.features;
    if (!rawFeatures || rawFeatures.length === 0) {
      return [
        { code: '1', label: 'Koridor 1 (Blok M - Kota)' },
        { code: '2', label: 'Koridor 2 (Pulo Gadung - Monas)' },
        { code: '3', label: 'Koridor 3 (Kalideres - Monas via Veteran)' },
        { code: '4', label: 'Koridor 4 (Pulo Gadung - Galunggung)' },
        { code: '5', label: 'Koridor 5 (Kampung Melayu - Ancol)' },
        { code: '6', label: 'Koridor 6 (Ragunan - Galunggung)' },
        { code: '7', label: 'Koridor 7 (Kp. Rambutan - Kp. Melayu)' },
        { code: '8', label: 'Koridor 8 (Lebak Bulus - Pasar Baru)' },
        { code: '9', label: 'Koridor 9 (Pinang Ranti - Pluit)' },
        { code: '10', label: 'Koridor 10 (Tanjung Priok - PGC)' },
        { code: '11', label: 'Koridor 11 (Pulo Gebang - Kp. Melayu)' },
        { code: '12', label: 'Koridor 12 (Pluit - Tanjung Priok)' },
        { code: '13', label: 'Koridor 13 (Ciledug - Tegal Mampang)' },
        { code: '14', label: 'Koridor 14 (JIS - Senen)' },
      ];
    }

    const routeMap = new Map<string, { code: string; label: string }>();

    for (const f of rawFeatures) {
      const p = f.properties || {};
      let code = p.route_code || p.corridor_code;
      if (!code && p.name) {
        const m = p.name.match(/Koridor\s+([A-Za-z0-9]+)/i);
        if (m) code = m[1];
      }
      if (!code) {
        code = p.corridor;
      }
      if (!code) continue;

      const codeStr = String(code).trim();
      if (!routeMap.has(codeStr)) {
        let label = p.name || `Koridor ${codeStr}`;
        if (!label.toLowerCase().startsWith('koridor')) {
          const cName = p.corridor_name || p.corridor;
          label = cName ? `Koridor ${codeStr} (${cName})` : `Koridor ${codeStr}`;
        }
        routeMap.set(codeStr, { code: codeStr, label });
      }
    }

    return Array.from(routeMap.values()).sort((a, b) => {
      const numA = parseInt(a.code, 10);
      const numB = parseInt(b.code, 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      return a.code.localeCompare(b.code, undefined, { numeric: true });
    });
  }, [layersData?.rute]);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // States untuk fitur PRD: AI Urban Council, Policy Brief, & Eksplorasi Koridor
  const [modalTab, setModalTab] = useState<'overview' | 'council' | 'behavior'>('overview');
  const [isPolicyBriefOpen, setIsPolicyBriefOpen] = useState<boolean>(false);
  const [optimalCandidates, setOptimalCandidates] = useState<OptimalStopCandidate[]>([]);
  const [isExploringCorridor, setIsExploringCorridor] = useState<boolean>(false);

  const fetchLayerData = async (layerId: string) => {
    try {
      const data = await apiClient.getLayerFeatures(layerId);
      setLayersData(prev => ({ ...prev, [layerId]: data }));
    } catch (err) {
      console.error(`Gagal memuat layer ${layerId}:`, err);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      fetchLayerData('transjakarta');
      fetchLayerData('rute');
    }
  }, [router]);

  // Keyboard shortcut listener untuk UX yang lebih cepat (Esc, Ctrl+K, /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || (e.ctrlKey && e.key === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (isPolicyBriefOpen) setIsPolicyBriefOpen(false);
        else if (isChatOpen) setIsChatOpen(false);
        else if (simulationResult && !isSimulationMinimized) setIsSimulationMinimized(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPolicyBriefOpen, isChatOpen, simulationResult, isSimulationMinimized]);

  if (!isAuthenticated) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-[#F4F4FA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2D2A70]" />
      </div>
    );
  }

  const toggleLayer = (id: string) => {
    setActiveLayers(prev => {
      const nextActive = !prev[id];
      if (nextActive && !layersData[id]) {
        fetchLayerData(id);
      }
      return { ...prev, [id]: nextActive };
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // Deteksi apakah input berupa pertanyaan, instruksi, atau dialog natural ke AI
    const queryLower = searchQuery.toLowerCase();
    const isAiQuery = 
      queryLower.length > 3 &&
      (/simulasi|tambah|pindah|relokasi|bottleneck|rute|analisis|evaluasi|kenapa|bagaimana|rekomendasi|\?|ke\s+[a-z]|dari\s+[a-z]|transit|konektivitas|halte baru/i.test(queryLower) ||
       queryLower.startsWith('tolong') || queryLower.startsWith('bisa') || queryLower.startsWith('buatkan') || queryLower.startsWith('coba'));

    if (isAiQuery) {
      setChatInitialPrompt(searchQuery);
      setIsChatOpen(true);
      setSearchQuery('');
      setIsSearching(false);
      showToast('💬 Mengarahkan permintaan ke Asisten AI...');
      return;
    }

    // Cek apakah input berupa koordinat "lat, lng" atau "lat lng"
    const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);

    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setTargetLocation({ latitude: lat, longitude: lng, zoom: 16, pitch: 25 });
        setSelectedLocation({ latitude: lat, longitude: lng });
        setIsSearching(false);
        showToast(`📍 Menuju koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        return;
      }
    }

    // 1. Cek pencarian nama halte langsung di data layer TransJakarta
    if (layersData?.transjakarta?.features) {
      const q = searchQuery.toLowerCase().trim().replace(/^halte\s+/i, '');
      const matchStop = layersData.transjakarta.features.find((f: any) => {
        const name = (f.properties?.name || '').toLowerCase();
        return name === q || name.includes(q);
      });

      if (matchStop && matchStop.geometry?.coordinates) {
        if (!matchStop.properties?.is_brt && stopFilter === 'brt') {
          setStopFilter('all');
        }
        const [lng, lat] = matchStop.geometry.coordinates;
        setTargetLocation({ latitude: lat, longitude: lng, zoom: 16.5, pitch: 25 });
        setSelectedLocation({ latitude: lat, longitude: lng });
        let parsedRoutes = [];
        if (typeof matchStop.properties?.routes === 'string') {
          try { parsedRoutes = JSON.parse(matchStop.properties.routes); } catch {}
        } else if (Array.isArray(matchStop.properties?.routes)) {
          parsedRoutes = matchStop.properties.routes;
        }
        setSelectedStop({
          name: matchStop.properties?.name || 'Halte TransJakarta',
          corridor: matchStop.properties?.corridor,
          route_codes: matchStop.properties?.route_codes,
          routes: parsedRoutes,
          lng,
          lat,
          is_brt: matchStop.properties?.is_brt,
          sub_type: matchStop.properties?.sub_type,
        });
        setIsSearching(false);
        showToast(`🚏 Halte ditemukan: ${matchStop.properties.name}`);
        return;
      }
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setTargetLocation({ latitude: lat, longitude: lng, zoom: 16, pitch: 25 });
        setSelectedLocation({ latitude: lat, longitude: lng });
        showToast(`🔍 Menuju: ${data[0].display_name.split(',')[0]}`);
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
    if (tripPickTarget === 'origin') {
      setOriginLocation({
        latitude: evt.lngLat.lat,
        longitude: evt.lngLat.lng,
        name: `Titik A (${evt.lngLat.lat.toFixed(3)}, ${evt.lngLat.lng.toFixed(3)})`,
      });
      if (!destinationLocation) {
        setTripPickTarget('destination');
        showToast(`📍 Titik Awal (A) diset. Sekarang klik titik tujuan (B).`);
      } else {
        setTripPickTarget(null);
        showToast(`📍 Titik Awal (A) diset: ${evt.lngLat.lat.toFixed(4)}, ${evt.lngLat.lng.toFixed(4)}`);
      }
      return;
    }

    if (tripPickTarget === 'destination') {
      setDestinationLocation({
        latitude: evt.lngLat.lat,
        longitude: evt.lngLat.lng,
        name: `Titik B (${evt.lngLat.lat.toFixed(3)}, ${evt.lngLat.lng.toFixed(3)})`,
      });
      setTripPickTarget(null);
      showToast(`🏁 Titik Tujuan (B) diset: ${evt.lngLat.lat.toFixed(4)}, ${evt.lngLat.lng.toFixed(4)}. Siap dianalisis!`);
      return;
    }

    setSelectedLocation({
      latitude: evt.lngLat.lat,
      longitude: evt.lngLat.lng,
    });
    // Reset hasil lama saat user memilih titik baru
    setSimulationResult(null);
    setIsochroneData(null);
    setIsSimulationMinimized(false);
    showToast(`📍 Titik dipilih: ${evt.lngLat.lat.toFixed(4)}, ${evt.lngLat.lng.toFixed(4)}`);
  };

  const handleRunODAnalysis = async () => {
    if (!originLocation || !destinationLocation) {
      alert("Silakan tentukan Titik Asal (A) dan Titik Tujuan (B) di peta terlebih dahulu.");
      return;
    }

    setIsAnalyzingOD(true);
    try {
      showToast("🔍 Menganalisis bottleneck & simulasi komuter As-Is vs To-Be...");
      const res = await apiClient.analyzeODTrip(originLocation, destinationLocation);

      // Client-side guarantee: Pastikan polyline rute selalu mengikuti bentuk jaringan jalan riil
      let enhancedResult = res;
      if (res.route_geojson?.features) {
        const enrichedFeatures = await Promise.all(
          res.route_geojson.features.map(async (feat: any) => {
            const coords = feat.geometry?.coordinates || [];
            // Jika koordinat sudah rapat (>25 titik), rute OSRM / GTFS sudah optimal
            if (coords.length >= 25) {
              return feat;
            }

            // Jika koordinat jarang (<25 titik), ambil rute jalan raya riil via OSRM
            if (coords.length >= 2) {
              const start = coords[0];
              const end = coords[coords.length - 1];
              try {
                const resp = await fetch(
                  `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`
                );
                const data = await resp.json();
                if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length > 2) {
                  return {
                    ...feat,
                    geometry: {
                      ...feat.geometry,
                      coordinates: data.routes[0].geometry.coordinates,
                    },
                  };
                }
              } catch (e) {
                console.warn("Client route enrich fallback:", e);
              }
            }
            return feat;
          })
        );

        enhancedResult = {
          ...res,
          route_geojson: {
            ...res.route_geojson,
            features: enrichedFeatures,
          },
        };
      }

      setOdTripResult(enhancedResult);
      showToast(`✅ Analisis tuntas: Bottleneck ${res.bottleneck.severity}!`);
      setIsChatOpen(true);
    } catch (err: any) {
      console.error("OD analysis error:", err);
      alert("Gagal menjalankan analisis perjalanan: " + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsAnalyzingOD(false);
    }
  };

  const handleRunSimulation = async (scenario: 'tambah' | 'pindah' = selectedStop ? 'pindah' : 'tambah') => {
    if (!selectedLocation) {
      alert("Silakan klik lokasi di peta terlebih dahulu untuk menentukan titik simulasi halte.");
      return;
    }

    setIsSimulating(true);
    try {
      const result = await apiClient.simulateStop({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        scenario_type: scenario,
        stop_name: selectedStop ? `Relokasi Halte ${selectedStop.name}` : '',
      });
      setSimulationResult(result);
      setIsSimulationMinimized(false);
      setTargetLocation({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        zoom: 16,
        pitch: 28,
      });

      // Ambil poligon isochrone jalan kaki 5 dan 10 menit
      try {
        const iso = await apiClient.getIsochrone(selectedLocation.latitude, selectedLocation.longitude);
        setIsochroneData(iso);
      } catch (isoErr) {
        console.warn("Isochrone fetch failed:", isoErr);
      }
      showToast(`✓ Simulasi tuntas: ${result.stop_name || 'Halte Usulan'}`);
    } catch (err: any) {
      alert(`Error simulasi: ${err.message || 'Gagal menjalankan simulasi'}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExploreCorridor = async (corridorName: string) => {
    setIsExploringCorridor(true);
    try {
      const res = await apiClient.findOptimalStops(corridorName);
      if (res && res.top_candidates && res.top_candidates.length > 0) {
        setOptimalCandidates(res.top_candidates);
        const topCand = res.top_candidates[0];
        setSelectedLocation({
          latitude: topCand.latitude,
          longitude: topCand.longitude,
        });
        setTargetLocation({
          latitude: topCand.latitude,
          longitude: topCand.longitude,
          zoom: 15.5,
          pitch: 28,
        });
        setSimulationResult(topCand.simulation_result);
        setIsSimulationMinimized(false);

        // Muat jangkauan isochrone
        apiClient.getIsochrone(topCand.latitude, topCand.longitude)
          .then(iso => setIsochroneData(iso))
          .catch(() => {});

        showToast(`🎯 Koridor ${corridorName}: 3 Titik Pareto ditemukan. Peta diarahkan ke Pilihan Warga.`);
      } else {
        alert("Tidak ditemukan titik optimal di koridor ini.");
      }
    } catch (err: any) {
      alert(`Gagal mengeksplorasi koridor: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsExploringCorridor(false);
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
                <div key={layer.id} className="flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 rounded-[10px] hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-[14px] h-[14px] rounded-full" style={{ backgroundColor: layer.color }}></div>
                      <span className="text-[11px] font-medium text-[#1A1832] leading-[14px]">{layer.name}</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!activeLayers[layer.id]}
                      aria-label={`Aktifkan atau nonaktifkan layer ${layer.name}`}
                      onClick={() => toggleLayer(layer.id)}
                      className={`w-8 h-[18px] rounded-full p-[3px] flex items-center cursor-pointer transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#2D2A70]/30 ${activeLayers[layer.id] ? 'justify-end' : 'bg-[#D1D5DB] justify-start'}`}
                      style={{ backgroundColor: activeLayers[layer.id] ? layer.color : '#D1D5DB' }}
                    >
                      <div className="w-3 h-3 bg-white rounded-full shadow-xs" />
                    </button>
                  </div>

                  {/* Sub-Filter Khusus Halte TransJakarta jika layer aktif */}
                  {layer.id === 'transjakarta' && activeLayers.transjakarta && (
                    <div className="mx-2 mb-2 p-2 bg-[#F4F4FA] rounded-xl border border-[#E2E2EF] flex flex-col gap-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[10px] text-[#6B6B8F] font-semibold">
                        <span className="flex items-center gap-1">
                          <Filter className="w-3 h-3 text-[#ED6B23]" />
                          Filter Kategori:
                        </span>
                        <span className="text-[9.5px] font-bold text-[#2D2A70]">
                          {filteredTransjakartaData?.features?.length || 0} aktif
                        </span>
                      </div>

                      {/* Segmented Pills */}
                      <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-[#E2E2EF]">
                        <button
                          onClick={() => {
                            setStopFilter('brt');
                            showToast('🚏 Menampilkan Halte BRT Utama (306 titik)');
                          }}
                          className={`py-1 text-[10px] font-bold rounded-md transition-all text-center cursor-pointer ${
                            stopFilter === 'brt'
                              ? 'bg-[#2D2A70] text-white shadow-2xs'
                              : 'text-[#6B6B8F] hover:text-[#1A1832]'
                          }`}
                          title="Hanya tampilkan halte koridor utama BRT (306 halte)"
                        >
                          BRT (306)
                        </button>
                        <button
                          onClick={() => {
                            setStopFilter('all');
                            showToast('🚏 Menampilkan Semua Halte (6.756 titik)');
                          }}
                          className={`py-1 text-[10px] font-bold rounded-md transition-all text-center cursor-pointer ${
                            stopFilter === 'all'
                              ? 'bg-[#2D2A70] text-white shadow-2xs'
                              : 'text-[#6B6B8F] hover:text-[#1A1832]'
                          }`}
                          title="Tampilkan semua halte dan bus stop se-DKI Jakarta (6.756 titik)"
                        >
                          Semua
                        </button>
                        <button
                          onClick={() => {
                            setStopFilter('feeder');
                            showToast('🚏 Menampilkan Halte Feeder Non-BRT');
                          }}
                          className={`py-1 text-[10px] font-bold rounded-md transition-all text-center cursor-pointer ${
                            stopFilter === 'feeder'
                              ? 'bg-[#2D2A70] text-white shadow-2xs'
                              : 'text-[#6B6B8F] hover:text-[#1A1832]'
                          }`}
                          title="Hanya tampilkan bus stop feeder non-BRT"
                        >
                          Feeder
                        </button>
                      </div>

                      {/* Opsi Fokus Rute Terpilih */}
                      {selectedRouteCode && (
                        <button
                          onClick={() => setFilterByRoute(!filterByRoute)}
                          className={`flex items-center justify-between px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                            filterByRoute
                              ? 'bg-[#ED6B23]/10 border-[#ED6B23] text-[#ED6B23]'
                              : 'bg-white border-[#E2E2EF] text-[#6B6B8F] hover:border-[#ED6B23]/40'
                          }`}
                        >
                          <span>Hanya halte Koridor {selectedRouteCode}</span>
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold ${filterByRoute ? 'bg-[#ED6B23] text-white' : 'bg-gray-200 text-transparent'}`}>✓</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Inspeksi Koridor / Rute TransJakarta */}
            <div className="mt-4 pt-3 border-t border-[#E2E2EF]">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-semibold text-[#6B6B8F] tracking-[0.6px] uppercase flex items-center gap-1">
                  <Compass className="w-3 h-3 text-[#139A73]" />
                  Lihat Per Rute (TJ)
                </span>
                {selectedRouteCode && (
                  <button
                    onClick={() => setSelectedRouteCode(null)}
                    className="text-[9.5px] text-[#ED6B23] font-semibold hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <select
                value={selectedRouteCode || ''}
                onChange={(e) => {
                  const code = e.target.value || null;
                  setSelectedRouteCode(code);
                  if (code && !activeLayers['rute']) {
                    setActiveLayers(prev => ({ ...prev, rute: true }));
                    if (!layersData['rute']) fetchLayerData('rute');
                  }
                  if (code) {
                    showToast(`🚌 Sorot Koridor ${code}`);
                  }
                }}
                className="w-full bg-[#F4F4FA] border border-[#E2E2EF] rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium text-[#1A1832] outline-none cursor-pointer focus:border-[#2D2A70]"
              >
                <option value="">Semua Rute TransJakarta</option>
                {availableRoutes.map((rt) => (
                  <option key={`route-opt-${rt.code}`} value={rt.code}>
                    {rt.label}
                  </option>
                ))}
              </select>

              {selectedRouteCode && (
                <div className="mt-2 px-2 py-1.5 bg-[#ED6B23]/10 border border-[#ED6B23]/25 rounded-lg flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#ED6B23]">
                    Koridor {selectedRouteCode} aktif
                  </span>
                  <button
                    onClick={() => setSelectedRouteCode(null)}
                    className="text-[9px] text-[#6B6B8F] hover:text-[#1A1832] font-semibold"
                  >
                    Tampilkan Semua
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Legenda Peta */}
          <div className="border-t border-[#E2E2EF] py-3 px-3">
            <span className="text-[9px] font-semibold text-[#6B6B8F] tracking-[0.54px] uppercase px-1">
              Legenda Simulasi
            </span>
            <div className="flex flex-col gap-2 mt-2 px-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-[3px] bg-[#2D2A70] rounded-full"></div>
                <span className="text-[10px] font-medium text-[#1A1832]">Rute Eksisting (As-Is)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-[2px] border-t-[2px] border-dashed border-[#ED6B23]"></div>
                <span className="text-[10px] font-medium text-[#ED6B23]">Rute Usulan (To-Be)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#139A73]/30 border border-[#139A73]"></div>
                <span className="text-[10px] text-[#6B6B8F]">Jangkauan 5 Mnt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#ED6B23]/20 border border-[#ED6B23]"></div>
                <span className="text-[10px] text-[#6B6B8F]">Jangkauan 10 Mnt</span>
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
            originLocation={originLocation}
            destinationLocation={destinationLocation}
            odTripResult={odTripResult}
            activeLayers={activeLayers}
            layersData={{
              ...layersData,
              transjakarta: filteredTransjakartaData,
            }}
            isochroneData={isochroneData}
            routeComparison={simulationResult?.route_comparison}
            optimalCandidates={optimalCandidates}
            selectedRouteCode={selectedRouteCode}
            onSelectRoute={(code) => {
              setSelectedRouteCode(code);
              if (code && !activeLayers['rute']) {
                setActiveLayers(prev => ({ ...prev, rute: true }));
                if (!layersData['rute']) fetchLayerData('rute');
              }
              if (code) showToast(`🚌 Sorot Koridor ${code}`);
            }}
            cursor={tripPickTarget ? 'crosshair' : 'default'}
            onSelectCandidate={(c) => {
              setSimulationResult(c.simulation_result);
              setIsSimulationMinimized(false);
              setSelectedLocation({ latitude: c.latitude, longitude: c.longitude });
              setTargetLocation({
                latitude: c.latitude,
                longitude: c.longitude,
                zoom: 16,
                pitch: 28,
              });
              apiClient.getIsochrone(c.latitude, c.longitude)
                .then(iso => setIsochroneData(iso))
                .catch(() => {});
              showToast(`🎯 Fokus ke ${c.title}`);
            }}
            selectedStop={selectedStop}
            onSelectStop={setSelectedStop}
            onSimulateStop={(stop) => {
              setSelectedLocation({ latitude: stop.lat, longitude: stop.lng });
              setTargetLocation({ latitude: stop.lat, longitude: stop.lng, zoom: 16, pitch: 25 });
              apiClient.getIsochrone(stop.lat, stop.lng).then(iso => setIsochroneData(iso)).catch(() => {});
              showToast(`📍 Halte ${stop.name} dipilih untuk simulasi`);
            }}
            onAskAiAboutStop={(stop) => {
              setSelectedLocation({ latitude: stop.lat, longitude: stop.lng });
              setChatInitialPrompt(`Bagaimana performa jangkauan pedestrian dan integrasi koridor Halte ${stop.name} saat ini?`);
              setIsChatOpen(true);
              showToast(`💬 Asisten AI siap menganalisis Halte ${stop.name}`);
            }}
            onMoveStop={(stop) => {
              setSelectedLocation({ latitude: stop.lat, longitude: stop.lng });
              setTargetLocation({ latitude: stop.lat, longitude: stop.lng, zoom: 16, pitch: 25 });
              setChatInitialPrompt(`Bagaimana rekomendasi relokasi untuk Halte ${stop.name}? Tolong simulasikan pemindahan halte ini ke lokasi yang lebih strategis di sekitarnya.`);
              setIsChatOpen(true);
              showToast(`🔄 Meminta AI mengevaluasi relokasi Halte ${stop.name}`);
            }}
            onSetAsOrigin={(loc) => {
              setOriginLocation(loc);
              if (!destinationLocation) {
                setTripPickTarget('destination');
                showToast(`📍 Titik A (Asal) diset: ${loc.name}. Klik titik lain untuk menentukan Titik B (Tujuan).`);
              } else {
                showToast(`📍 Titik A (Asal) diset: ${loc.name}`);
              }
            }}
            onSetAsDestination={(loc) => {
              setDestinationLocation(loc);
              setTripPickTarget(null);
              showToast(`🏁 Titik B (Tujuan) diset: ${loc.name}`);
            }}
            onClick={handleMapClick}
          />

          {/* Top Control - Left (Mobile toggle + AI Badge + Quick Explorer) */}
          <div className="absolute top-4 left-4 md:left-6 z-10 flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-[#2D2A70]"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* AI Assistant Status Badge */}
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-md border border-[#E2E2EF]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11.5px] font-bold text-[#2D2A70] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ED6B23]" />
                <span>LokaMaya AI Copilot</span>
              </span>
              <span className="hidden sm:inline-block text-[10.5px] text-[#6B6B8F] border-l border-gray-200 pl-2 font-medium">
                Klik peta atau tanyakan apa saja
              </span>
            </div>

            {/* Quick Corridor Explorer */}
            <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl items-center gap-1 shadow-md border border-[#E2E2EF] hidden lg:flex">
              <span className="text-[10.5px] font-semibold text-[#6B6B8F] px-1.5 flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#2D2A70]" />
                Eksplorasi Koridor:
              </span>
              {(['Daan Mogot', 'Sudirman', 'Gatot Subroto'] as const).map((corridor) => (
                <button
                  key={corridor}
                  disabled={isExploringCorridor}
                  onClick={() => {
                    handleExploreCorridor(corridor);
                    setChatInitialPrompt(`Analisis kesenjangan halte dan bottleneck transit di sepanjang koridor ${corridor}. Berikan rekomendasi penataan halte.`);
                    setIsChatOpen(true);
                  }}
                  className="px-2 py-1 text-[10.5px] font-medium text-[#2D2A70] bg-[#F4F4FA] hover:bg-[#2D2A70] hover:text-white rounded-[7px] border border-[#E2E2EF] transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  {isExploringCorridor ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null}
                  {corridor}
                </button>
              ))}
            </div>
          </div>

          {/* Floating OD Trip Planner Bar (Active when origin or destination is chosen) */}
          {(originLocation || destinationLocation || odTripResult) && (
            <div className="absolute top-[66px] left-4 md:left-6 z-10 bg-white/95 backdrop-blur-md border border-[#2D2A70]/20 shadow-xl rounded-2xl p-2 flex flex-wrap items-center gap-2 max-w-[calc(100vw-32px)] animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Origin Point A */}
              <button
                type="button"
                onClick={() => {
                  setTripPickTarget('origin');
                  showToast('📍 Klik peta untuk memilih Titik Asal (A)');
                }}
                className={`px-2.5 py-1 rounded-xl border flex items-center gap-2 cursor-pointer transition-all text-left ${
                  tripPickTarget === 'origin'
                    ? 'border-[#10B981] bg-emerald-50 shadow-xs ring-2 ring-[#10B981]/20'
                    : originLocation
                    ? 'border-emerald-200 bg-white hover:bg-emerald-50/50'
                    : 'border-dashed border-gray-300 bg-gray-50'
                }`}
                title="Klik untuk memilih/mengubah Titik Awal (A)"
              >
                <div className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                  A
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-gray-500 uppercase leading-tight">Titik Asal</span>
                  <span className="text-[11px] font-bold text-[#1A1832] max-w-[120px] truncate leading-tight">
                    {originLocation ? (originLocation.name || `${originLocation.latitude.toFixed(3)}, ${originLocation.longitude.toFixed(3)}`) : 'Klik di peta...'}
                  </span>
                </div>
              </button>

              {/* Swap Button */}
              <button
                type="button"
                onClick={() => {
                  if (originLocation && destinationLocation) {
                    const temp = originLocation;
                    setOriginLocation(destinationLocation);
                    setDestinationLocation(temp);
                    setOdTripResult(null);
                    showToast('⇄ Titik Asal dan Tujuan ditukar');
                  }
                }}
                disabled={!originLocation || !destinationLocation}
                className="w-7 h-7 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                title="Tukar Titik A dan B"
                aria-label="Tukar Titik Asal dan Titik Tujuan"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              {/* Destination Point B */}
              <button
                type="button"
                onClick={() => {
                  setTripPickTarget('destination');
                  showToast('🏁 Klik peta untuk memilih Titik Tujuan (B)');
                }}
                className={`px-2.5 py-1 rounded-xl border flex items-center gap-2 cursor-pointer transition-all text-left ${
                  tripPickTarget === 'destination'
                    ? 'border-[#EF4444] bg-red-50 shadow-xs ring-2 ring-[#EF4444]/20'
                    : destinationLocation
                    ? 'border-red-200 bg-white hover:bg-red-50/50'
                    : 'border-dashed border-gray-300 bg-gray-50'
                }`}
                title="Klik untuk memilih/mengubah Titik Tujuan (B)"
              >
                <div className="w-5 h-5 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                  B
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-gray-500 uppercase leading-tight">Titik Tujuan</span>
                  <span className="text-[11px] font-bold text-[#1A1832] max-w-[120px] truncate leading-tight">
                    {destinationLocation ? (destinationLocation.name || `${destinationLocation.latitude.toFixed(3)}, ${destinationLocation.longitude.toFixed(3)}`) : 'Klik di peta...'}
                  </span>
                </div>
              </button>

              {/* Action Button: Analisis Bottleneck AI */}
              <button
                onClick={handleRunODAnalysis}
                disabled={!originLocation || !destinationLocation || isAnalyzingOD}
                className="px-3 py-1.5 bg-gradient-to-r from-[#2D2A70] to-[#1E1E3A] hover:brightness-110 text-white rounded-xl text-[11px] font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isAnalyzingOD ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ED6B23]" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-[#ED6B23]" />
                )}
                <span>{isAnalyzingOD ? 'Menganalisis...' : '⚡ Analisis Bottleneck AI'}</span>
              </button>

              {/* Tanya AI Bottleneck */}
              <button
                type="button"
                onClick={() => {
                  if (originLocation && destinationLocation) {
                    setChatInitialPrompt(`Analisis bottleneck perjalanan komuter dari ${originLocation.name} ke ${destinationLocation.name}. Apa kendala pejalan kaki dan koridor transitnya?`);
                    setIsChatOpen(true);
                  }
                }}
                disabled={!originLocation || !destinationLocation}
                className="px-2.5 py-1.5 bg-[#F4F4FA] hover:bg-[#2D2A70] text-[#2D2A70] hover:text-white rounded-xl text-[11px] font-bold border border-[#E2E2EF] flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                title="Tanyakan bottleneck komuter ini ke AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#ED6B23]" />
                <span className="hidden sm:inline">Tanya AI</span>
              </button>

              {/* Reset Trip Button */}
              <button
                onClick={() => {
                  setOriginLocation(null);
                  setDestinationLocation(null);
                  setOdTripResult(null);
                  setTripPickTarget(null);
                  showToast('🔄 Rute perjalanan direset');
                }}
                className="px-2 py-1 text-[10.5px] font-semibold text-gray-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                title="Hapus rute A dan B"
              >
                Reset
              </button>
            </div>
          )}

          {/* Top Control - Right (AI Omnibar + Chat Assistant Toggle) */}
          <div className="absolute top-4 right-4 md:right-6 z-10 flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center bg-white/95 backdrop-blur-md border border-[#2D2A70]/20 rounded-xl px-3 py-[7px] w-[220px] sm:w-[320px] md:w-[380px] shadow-md focus-within:ring-2 focus-within:ring-[#2D2A70]/20 transition-all">
              <Search className="w-3.5 h-3.5 text-[#2D2A70] mr-2 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tanya AI atau cari halte/lokasi... (tekan /)"
                className="bg-transparent border-none outline-none text-[12px] w-full text-[#1A1832] placeholder:text-[#1A1832]/50"
                disabled={isSearching}
              />
              <span className="hidden md:inline-block text-[9px] font-semibold text-gray-400 bg-gray-100 px-1 py-0.5 rounded ml-1 shrink-0" title="Tekan / untuk mencari">
                /
              </span>
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9999BF] ml-2 shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (searchQuery.trim()) {
                      setChatInitialPrompt(searchQuery);
                      setSearchQuery('');
                    }
                    setIsChatOpen(true);
                  }}
                  className="ml-2 p-1 hover:bg-[#2D2A70]/10 text-[#ED6B23] rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Tanyakan langsung ke AI Copilot"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="px-4 py-[8px] bg-[#2D2A70] hover:bg-[#1E1E3A] text-white text-[12px] font-bold rounded-xl shadow-md transition-all whitespace-nowrap hidden sm:flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ED6B23]" />
              <span>{isChatOpen ? 'Tutup AI' : 'Buka AI'}</span>
            </button>
          </div>

          {/* Quick Floating Stop Filter Pill Bar on Map (Active when TransJakarta layer is ON) */}
          {activeLayers.transjakarta && (
            <div className={`absolute ${(originLocation || destinationLocation || odTripResult) ? 'top-[128px]' : 'top-[66px]'} left-4 md:left-6 z-10 bg-white/95 backdrop-blur-md border border-[#E2E2EF] shadow-md rounded-xl p-1 flex items-center gap-1 max-w-[calc(100vw-32px)] overflow-x-auto transition-all duration-200`}>
              <span className="text-[10px] font-bold text-[#2D2A70] px-2 flex items-center gap-1 uppercase tracking-wider shrink-0">
                <Bus className="w-3.5 h-3.5 text-[#ED6B23]" />
                <span className="hidden sm:inline">Filter Halte:</span>
              </span>
              <button
                onClick={() => {
                  setStopFilter('brt');
                  showToast('🚏 Menampilkan Halte BRT Utama (306 titik)');
                }}
                className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  stopFilter === 'brt'
                    ? 'bg-[#2D2A70] text-white shadow-2xs'
                    : 'text-[#6B6B8F] hover:bg-gray-100'
                }`}
                title="Tampilkan hanya stasiun koridor utama BRT (306 halte)"
              >
                BRT Utama (306)
              </button>
              <button
                onClick={() => {
                  setStopFilter('all');
                  showToast('🚏 Menampilkan Semua Halte (6.756 titik)');
                }}
                className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  stopFilter === 'all'
                    ? 'bg-[#2D2A70] text-white shadow-2xs'
                    : 'text-[#6B6B8F] hover:bg-gray-100'
                }`}
                title="Tampilkan semua halte dan bus stop se-DKI Jakarta (6.756 titik)"
              >
                Semua Halte
              </button>
              <button
                onClick={() => {
                  setStopFilter('feeder');
                  showToast('🚏 Menampilkan Halte Feeder Non-BRT');
                }}
                className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  stopFilter === 'feeder'
                    ? 'bg-[#2D2A70] text-white shadow-2xs'
                    : 'text-[#6B6B8F] hover:bg-gray-100'
                }`}
                title="Hanya bus stop feeder non-BRT"
              >
                Feeder Saja
              </button>

              {selectedRouteCode && (
                <button
                  onClick={() => setFilterByRoute(!filterByRoute)}
                  className={`ml-1 px-2.5 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                    filterByRoute
                      ? 'bg-[#ED6B23] border-[#ED6B23] text-white shadow-2xs'
                      : 'bg-white border-[#ED6B23]/50 text-[#ED6B23] hover:bg-[#ED6B23]/10'
                  }`}
                  title={`Saring hanya halte yang dilewati Koridor ${selectedRouteCode}`}
                >
                  <span>Fokus Koridor {selectedRouteCode}</span>
                  {filterByRoute && <span>✓</span>}
                </button>
              )}
            </div>
          )}

          {/* Corridor Pareto Candidates Floating Bar */}
          {optimalCandidates.length > 0 && (
            <div className="absolute top-20 sm:top-20 left-1/2 -translate-x-1/2 z-15 bg-white/95 backdrop-blur-md border border-[#2D2A70]/20 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#2D2A70] flex items-center gap-1 whitespace-nowrap">
                <Compass className="w-3.5 h-3.5 text-[#ED6B23]" />
                Kandidat Pareto:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[80vw]">
                {optimalCandidates.map((cand, idx) => (
                  <button
                    key={`opt-cand-${cand.rank || idx}-${cand.latitude}-${cand.longitude}`}
                    onClick={() => {
                      setSimulationResult(cand.simulation_result);
                      setIsSimulationMinimized(false);
                      setSelectedLocation({ latitude: cand.latitude, longitude: cand.longitude });
                      setTargetLocation({
                        latitude: cand.latitude,
                        longitude: cand.longitude,
                        zoom: 16,
                        pitch: 28,
                      });
                      apiClient.getIsochrone(cand.latitude, cand.longitude)
                        .then(iso => setIsochroneData(iso))
                        .catch(() => {});
                      showToast(`🎯 Peta diarahkan ke ${cand.title}`);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      simulationResult?.stop_name === cand.title
                        ? 'bg-[#2D2A70] text-white shadow-xs'
                        : 'bg-[#F4F4FA] text-[#1A1832] hover:bg-gray-200 border border-[#E2E2EF]'
                    }`}
                  >
                    {idx === 0 ? '🥇 Warga' : idx === 1 ? '🥈 UMKM' : '🥉 Resilien'}: {cand.title.split('(')[0].replace('Kandidat ', '')} ({cand.simulation_result.walk_accessibility?.score || 0})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Simulation Result Minimized Floating Pill */}
          {simulationResult && isSimulationMinimized && (
            <div className="absolute top-20 sm:top-24 left-4 sm:left-6 z-20 bg-white/95 backdrop-blur-md border border-[#2D2A70]/20 shadow-xl rounded-2xl p-2.5 flex items-center gap-3 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-[#2D2A70] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-[#ED6B23]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-[#1A1832] leading-tight">
                  {simulationResult.stop_name || 'Hasil Simulasi Halte'}
                </span>
                <span className="text-[10px] text-[#6B6B8F]">
                  Akses: <strong className="text-[#139A73]">{simulationResult.walk_accessibility?.score || 0}/100</strong> • UMKM: <strong className="text-[#ED6B23]">{simulationResult.umkm_economic?.score || 0}/100</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={() => setIsSimulationMinimized(false)}
                  className="px-2.5 py-1 bg-[#2D2A70] hover:bg-[#1E1E3A] text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                  title="Buka panel simulasi lengkap"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Buka</span>
                </button>
                <button
                  onClick={() => setSimulationResult(null)}
                  className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#6B6B8F] cursor-pointer"
                  title="Tutup hasil simulasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Simulation Result Full Overlay Modal */}
          {simulationResult && !isSimulationMinimized && (
            <div className="absolute top-20 sm:top-24 left-4 sm:left-6 z-20 w-[calc(100vw-32px)] sm:w-[410px] max-h-[calc(100vh-140px)] overflow-y-auto bg-white/95 backdrop-blur-md border border-[#E2E2EF] shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E2EF]">
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsSimulationMinimized(true)}
                    className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#6B6B8F] transition-colors cursor-pointer"
                    title="Kecilkan panel agar peta leluasa dilihat"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSimulationResult(null)}
                    className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#6B6B8F] transition-colors cursor-pointer"
                    title="Tutup hasil simulasi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-[#F4F4FA] p-1 rounded-xl mt-3 border border-[#E2E2EF]">
                <button
                  onClick={() => setModalTab('overview')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    modalTab === 'overview'
                      ? 'bg-white text-[#2D2A70] shadow-xs'
                      : 'text-[#6B6B8F] hover:text-[#1A1832]'
                  }`}
                >
                  <Sparkle className="w-3 h-3" />
                  Rute & Skor
                </button>
                <button
                  onClick={() => setModalTab('council')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    modalTab === 'council'
                      ? 'bg-white text-[#2D2A70] shadow-xs'
                      : 'text-[#6B6B8F] hover:text-[#1A1832]'
                  }`}
                >
                  <Users className="w-3 h-3 text-indigo-600" />
                  AI Council
                </button>
                <button
                  onClick={() => setModalTab('behavior')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    modalTab === 'behavior'
                      ? 'bg-white text-[#2D2A70] shadow-xs'
                      : 'text-[#6B6B8F] hover:text-[#1A1832]'
                  }`}
                >
                  <Activity className="w-3 h-3 text-[#ED6B23]" />
                  Efek Perilaku
                </button>
              </div>

              {/* TAB 1: RUTE & SKOR */}
              {modalTab === 'overview' && (
                <div className="flex flex-col gap-2 mt-3 animate-in fade-in duration-200">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2">
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
                  <div className="bg-[#F8F8FC] border border-[#E2E2EF] rounded-xl p-2.5 flex flex-col gap-1 text-[11px]">
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

                  {/* Route As-Is vs To-Be Comparison */}
                  {simulationResult.route_comparison && (
                    <RouteComparisonCard
                      data={simulationResult.route_comparison}
                      onSelectStop={(stop) => {
                        if (stop.latitude && stop.longitude) {
                          setTargetLocation({
                            latitude: stop.latitude,
                            longitude: stop.longitude,
                            zoom: 16,
                          });
                        }
                      }}
                    />
                  )}

                  {/* AI Narrative */}
                  <div className="bg-[#2D2A70]/5 border border-[#2D2A70]/15 rounded-xl p-3">
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

              {/* TAB 2: AI URBAN COUNCIL */}
              {modalTab === 'council' && (
                <div className="animate-in fade-in duration-200">
                  {simulationResult.deliberation ? (
                    <UrbanCouncilCard deliberation={simulationResult.deliberation} />
                  ) : (
                    <div className="p-4 text-center text-[#6B6B8F] text-xs">
                      Data deliberasi Urban Council belum tersedia untuk titik ini.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DAMPAK PERILAKU */}
              {modalTab === 'behavior' && (
                <div className="animate-in fade-in duration-200">
                  {simulationResult.behavioral_ripple ? (
                    <BehavioralRippleCard data={simulationResult.behavioral_ripple} />
                  ) : (
                    <div className="p-4 text-center text-[#6B6B8F] text-xs">
                      Data proyeksi efek domino perilaku belum tersedia untuk titik ini.
                    </div>
                  )}
                </div>
              )}

              {/* One-Click Policy Brief Action Button */}
              {simulationResult.policy_brief && (
                <button
                  onClick={() => setIsPolicyBriefOpen(true)}
                  className="mt-3 w-full py-2.5 bg-gradient-to-r from-[#2D2A70] to-[#1E1E3A] hover:from-[#1E1E3A] hover:to-[#2D2A70] text-white text-[11px] font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#ED6B23]" />
                  <span>Lihat Naskah Advokasi Kebijakan (Policy Brief)</span>
                </button>
              )}
            </div>
          )}

          {/* Floating Toast Notification */}
          {toastMessage && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1E1E3A]/95 backdrop-blur-md text-white border border-[#ED6B23]/40 shadow-2xl rounded-full px-4 py-2 flex items-center gap-2 text-[11.5px] font-semibold animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none">
              <Sparkles className="w-3.5 h-3.5 text-[#ED6B23] animate-pulse" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Smart Contextual Action Pill (Active when user clicked/selected a coordinate on the map) */}
          {selectedLocation && !simulationResult && (
            <div className="absolute bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md border border-[#2D2A70]/20 shadow-2xl rounded-2xl p-2 sm:p-2.5 flex flex-wrap items-center justify-center gap-2 max-w-[calc(100vw-32px)] animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center gap-2 pl-2 pr-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ED6B23] animate-ping" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-gray-500 uppercase leading-none">Titik Terpilih</span>
                  <span className="text-[11px] font-bold text-[#2D2A70] leading-tight">
                    {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="h-6 w-[1px] bg-gray-200 hidden sm:block" />

              {/* Tanya AI */}
              <button
                onClick={() => {
                  setChatInitialPrompt(`Tolong analisis potensi dan kebutuhan halte transportasi umum di titik koordinat ${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}.`);
                  setIsChatOpen(true);
                  showToast('💬 Mengajukan pertanyaan ke Asisten AI...');
                }}
                className="px-3 py-1.5 bg-[#2D2A70] hover:bg-[#1E1E3A] text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#ED6B23]" />
                <span>Tanya AI</span>
              </button>

              {/* Simulasikan Halte Baru */}
              <button
                onClick={() => handleRunSimulation('tambah')}
                disabled={isSimulating}
                className="px-3 py-1.5 bg-[#ED6B23] hover:bg-[#d65f1e] text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bus className="w-3.5 h-3.5" />}
                <span>{isSimulating ? 'Menganalisis...' : 'Simulasi Halte Baru'}</span>
              </button>

              {/* Set Titik Asal A */}
              <button
                onClick={() => {
                  setOriginLocation({
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    name: `Titik A (${selectedLocation.latitude.toFixed(3)}, ${selectedLocation.longitude.toFixed(3)})`,
                  });
                  if (!destinationLocation) setTripPickTarget('destination');
                  showToast('📍 Titik Asal (A) ditetapkan');
                }}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#10B981] border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Jadikan titik awal rute komuter"
              >
                <span>Set Titik A</span>
              </button>

              {/* Set Titik Tujuan B */}
              <button
                onClick={() => {
                  setDestinationLocation({
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    name: `Titik B (${selectedLocation.latitude.toFixed(3)}, ${selectedLocation.longitude.toFixed(3)})`,
                  });
                  setTripPickTarget(null);
                  showToast('🏁 Titik Tujuan (B) ditetapkan');
                }}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-[#EF4444] border border-red-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Jadikan titik tujuan rute komuter"
              >
                <span>Set Titik B</span>
              </button>

              {/* Close Selection */}
              <button
                onClick={() => {
                  setSelectedLocation(null);
                }}
                className="w-7 h-7 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer ml-auto sm:ml-0"
                title="Batalkan pilihan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Bottom Right AI Button & Widget */}
          <ChatWidget
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            initialPrompt={chatInitialPrompt}
            onPromptConsumed={() => setChatInitialPrompt(null)}
            contextLocation={selectedLocation ? {
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              stop_name: simulationResult?.stop_name || `Titik Terpilih (${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)})`,
            } : null}
            originLocation={originLocation}
            destinationLocation={destinationLocation}
            odTripResult={odTripResult}
            onClearContextLocation={() => {
              setSelectedLocation(null);
              setSimulationResult(null);
              setIsochroneData(null);
              showToast('📌 Pin konteks dilepaskan');
            }}
            onClearODLocations={() => {
              setOriginLocation(null);
              setDestinationLocation(null);
              setOdTripResult(null);
              showToast('🔄 Rute perjalanan direset');
            }}
            onFocusLocation={(loc) => {
              setSelectedLocation({
                latitude: loc.latitude,
                longitude: loc.longitude,
              });
              setTargetLocation({
                latitude: loc.latitude,
                longitude: loc.longitude,
                zoom: loc.zoom || 16,
                pitch: 28,
              });
              apiClient.getIsochrone(loc.latitude, loc.longitude)
                .then(iso => setIsochroneData(iso))
                .catch(() => {});
              showToast(`🎯 Peta diarahkan ke: ${loc.name || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`}`);
            }}
            onSimulationTriggered={(sim) => {
              setSimulationResult(sim);
              setIsSimulationMinimized(false);
              setSelectedLocation({
                latitude: sim.latitude,
                longitude: sim.longitude,
              });
              setTargetLocation({
                latitude: sim.latitude,
                longitude: sim.longitude,
                zoom: 16,
                pitch: 28,
              });
              apiClient.getIsochrone(sim.latitude, sim.longitude)
                .then(iso => setIsochroneData(iso))
                .catch(err => console.warn('Isochrone fetch failed:', err));
              showToast(`🎯 AI mengarahkan peta ke: ${sim.stop_name || 'Halte Usulan'}`);
            }}
            onODTripTriggered={(od) => {
              setOdTripResult(od);
              if (od.origin) setOriginLocation(od.origin);
              if (od.destination) setDestinationLocation(od.destination);
              showToast(`🎯 Bottleneck perjalanan: ${od.bottleneck.severity}`);
            }}
            onToggleLayer={(layerId) => {
              setActiveLayers(prev => ({ ...prev, [layerId]: true }));
              if (!layersData[layerId]) fetchLayerData(layerId);
              showToast(`🗺️ Layer ${layerId.toUpperCase()} diaktifkan di peta`);
            }}
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

          {/* One-Click Policy Brief Fullscreen/Centered Modal */}
          {simulationResult && (
            <PolicyBriefModal
              isOpen={isPolicyBriefOpen}
              onClose={() => setIsPolicyBriefOpen(false)}
              stopName={simulationResult.stop_name || 'Halte Usulan'}
              markdownContent={simulationResult.policy_brief || ''}
            />
          )}
        </div>
      </div>
    </div>
  );
}
