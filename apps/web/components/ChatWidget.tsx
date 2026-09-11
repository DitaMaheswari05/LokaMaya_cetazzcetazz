import { X, ArrowRight, Square, Sparkles, CheckCircle2, MapPin, Compass, AlertTriangle, Clock, Footprints, Bus, Navigation, Shuffle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiClient } from '@/lib/api/client';
import { ChatMessageItem, SimulationResult, ODLocation, ODTripAnalysisResult } from '@/types/api';

interface ChatMessageWithSim extends ChatMessageItem {
  simulation?: SimulationResult;
  odTrip?: ODTripAnalysisResult;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  contextLocation?: { latitude: number; longitude: number; stop_name?: string } | null;
  originLocation?: ODLocation | null;
  destinationLocation?: ODLocation | null;
  odTripResult?: ODTripAnalysisResult | null;
  onClearContextLocation?: () => void;
  onClearODLocations?: () => void;
  onFocusLocation?: (loc: { latitude: number; longitude: number; name?: string; zoom?: number }) => void;
  onSimulationTriggered?: (simulation: SimulationResult) => void;
  onODTripTriggered?: (odTrip: ODTripAnalysisResult) => void;
  initialPrompt?: string | null;
  onPromptConsumed?: () => void;
  onToggleLayer?: (layerId: string) => void;
}

interface StreamStatus {
  stage: string;
  message: string;
  step: number;
  total_steps: number;
}

interface ExtractedLocation {
  name: string;
  latitude: number;
  longitude: number;
}

function extractLocationsFromText(content: string): ExtractedLocation[] {
  if (!content) return [];
  const results: ExtractedLocation[] = [];
  const lines = content.split('\n');
  let currentTitle = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const titleMatch = line.match(/(?:🥇|🥈|🥉)?\s*(Kandidat[^\n*:(]+|Halte[^\n*:(]+)/i);
    if (titleMatch) {
      currentTitle = titleMatch[1].trim();
    }

    const coordMatch = line.match(/Lat(?:itude)?[:\s]*([-+]?\d{1,2}\.\d{3,7})[,\s]+Lng(?:itude)?[:\s]*([-+]?\d{1,3}\.\d{3,7})/i);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        if (!results.some(r => Math.abs(r.latitude - lat) < 0.0001 && Math.abs(r.longitude - lng) < 0.0001)) {
          results.push({
            name: currentTitle || `Titik (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
            latitude: lat,
            longitude: lng,
          });
        }
      }
      currentTitle = '';
    } else {
      const parenMatch = line.match(/\((-6\.\d{3,7}),\s*(106\.\d{3,7})\)/);
      if (parenMatch) {
        const lat = parseFloat(parenMatch[1]);
        const lng = parseFloat(parenMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          if (!results.some(r => Math.abs(r.latitude - lat) < 0.0001 && Math.abs(r.longitude - lng) < 0.0001)) {
            results.push({
              name: currentTitle || `Titik (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
              latitude: lat,
              longitude: lng,
            });
          }
        }
        currentTitle = '';
      }
    }
  }
  return results;
}

export default function ChatWidget({
  isOpen,
  onClose,
  contextLocation,
  originLocation,
  destinationLocation,
  odTripResult,
  onClearContextLocation,
  onClearODLocations,
  onFocusLocation,
  onSimulationTriggered,
  onODTripTriggered,
  initialPrompt,
  onPromptConsumed,
  onToggleLayer,
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessageWithSim[]>([
    {
      role: 'assistant',
      content: 'Halo! Klik sembarang titik di peta untuk memeriksa jangkauan pedestrian atau tanyakan rencana halte TransJakarta.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [odTripStepTab, setOdTripStepTab] = useState<Record<number, 'as_is' | 'to_be'>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync odTripResult jika dipicu dari tombol di luar chat (misal floating planner map)
  useEffect(() => {
    if (odTripResult) {
      setMessages(prev => {
        if (prev.some(m => m.odTrip === odTripResult)) return prev;
        return [
          ...prev,
          {
            role: 'assistant',
            content: odTripResult.ai_narrative,
            odTrip: odTripResult,
          },
        ];
      });
    }
  }, [odTripResult]);

  // Deteksi manual scrolling pengguna agar auto-scroll tidak mengganggu bacaan
  const handleScroll = () => {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 60;
  };

  useEffect(() => {
    if (isOpen && autoScrollRef.current && chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, status, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessageItem = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    
    // Siapkan placeholder asisten kosong untuk menampung streaming token real-time
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setSuggestions([]);
    setIsLoading(true);
    setStatus({
      stage: 'understanding',
      message: 'Menganalisis pertanyaan & mencocokkan konteks koridor...',
      step: 1,
      total_steps: 3,
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await apiClient.streamChatMessage(
        {
          message: text,
          context_location: contextLocation ? {
            latitude: contextLocation.latitude,
            longitude: contextLocation.longitude,
            stop_name: contextLocation.stop_name,
          } : undefined,
          origin_location: originLocation ? {
            latitude: originLocation.latitude,
            longitude: originLocation.longitude,
            name: originLocation.name,
          } : undefined,
          destination_location: destinationLocation ? {
            latitude: destinationLocation.latitude,
            longitude: destinationLocation.longitude,
            name: destinationLocation.name,
          } : undefined,
          history: nextMessages.map(m => ({ role: m.role, content: m.content })),
        },
        {
          onStatus: (newStatus) => {
            setStatus(newStatus);
          },
          onDelta: (chunk) => {
            setMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: (updated[lastIdx].content || '') + chunk,
                };
              }
              return updated;
            });
          },
          onComplete: (resp) => {
            setMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                const finalContent = (resp.message && resp.message.trim() !== '')
                  ? resp.message
                  : (updated[lastIdx].content && updated[lastIdx].content.trim() !== '')
                  ? updated[lastIdx].content
                  : 'Selesai menganalisis.';
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: finalContent,
                  simulation: resp.triggered_simulation,
                  odTrip: resp.triggered_od_trip,
                };
              }
              return updated;
            });

            if (resp.suggested_questions && resp.suggested_questions.length > 0) {
              setSuggestions(resp.suggested_questions);
            }

            if (resp.triggered_simulation && onSimulationTriggered) {
              onSimulationTriggered(resp.triggered_simulation);
            }

            if (resp.triggered_od_trip && onODTripTriggered) {
              onODTripTriggered(resp.triggered_od_trip);
            }

            if (resp.active_layer_toggle && onToggleLayer) {
              onToggleLayer(resp.active_layer_toggle);
            }

            setStatus(null);
            setIsLoading(false);
          },
          onError: (err) => {
            setMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: `Maaf, terjadi kendala saat menghubungi AI: ${err.message || 'Coba lagi beberapa saat lagi.'}`,
                };
              }
              return updated;
            });
            setStatus(null);
            setIsLoading(false);
          },
        },
        controller.signal
      );
    } catch (err: any) {
      if (controller.signal.aborted) {
        return;
      }
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: `Maaf, koneksi terputus: ${err.message || 'Silakan ulangi.'}`,
          };
        }
        return updated;
      });
      setStatus(null);
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStatus(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (isOpen && initialPrompt && !isLoading) {
      handleSend(initialPrompt);
      if (onPromptConsumed) onPromptConsumed();
    }
  }, [isOpen, initialPrompt, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-[80px] right-4 sm:right-6 z-30 w-[calc(100vw-32px)] sm:w-[390px] max-h-[min(540px,calc(100vh-140px))] bg-white border border-[#E2E2EF] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] rounded-[20px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#2D2A70]">
        <div className="flex items-center gap-2.5">
          <div className="w-[28px] h-[28px] bg-[#ED6B23] rounded-full flex items-center justify-center shadow-xs">
            <span className="text-[10px] font-bold text-white tracking-wide">AI</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-white leading-none">LokaMaya Assistant</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#139A73]" />
            </div>
            {originLocation && destinationLocation ? (
              <div className="flex items-center gap-1.5 mt-0.5 bg-white/15 px-2 py-0.5 rounded-full w-fit">
                <span className="text-[10px] text-white/90 font-bold truncate max-w-[210px] flex items-center gap-1">
                  <span>📍 A → 🏁 B (Mode Rute)</span>
                </span>
                {onClearODLocations && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearODLocations();
                    }}
                    title="Reset rute perjalanan"
                    aria-label="Reset rute perjalanan"
                    className="w-3.5 h-3.5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-[9px] cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : contextLocation ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  onClick={() => onFocusLocation && onFocusLocation({
                    latitude: contextLocation.latitude,
                    longitude: contextLocation.longitude,
                    name: contextLocation.stop_name,
                    zoom: 16,
                  })}
                  title="Klik untuk pusatkan peta ke titik ini"
                  className="text-[10px] text-white/90 hover:text-white font-medium truncate max-w-[190px] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>📌 {contextLocation.stop_name || `${contextLocation.latitude.toFixed(4)}, ${contextLocation.longitude.toFixed(4)}`}</span>
                </button>
                {onClearContextLocation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearContextLocation();
                    }}
                    title="Lepas pin konteks"
                    aria-label="Lepas pin konteks"
                    className="w-3.5 h-3.5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-[9px] cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-white/60 mt-0.5">
                Spatial Intelligence & Policy Copilot
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Tutup asisten chat"
          className="text-white/70 hover:text-white transition-colors flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body / Chat History */}
      <div
        ref={chatBodyRef}
        onScroll={handleScroll}
        className="flex flex-col p-3.5 gap-2.5 overflow-y-auto max-h-[350px] scroll-smooth"
      >
        {/* Quick Prompt Starters saat chat baru dibuka */}
        {messages.length === 1 && !isLoading && (
          <div className="flex flex-col gap-1.5 mb-1 bg-gradient-to-br from-[#2D2A70]/5 to-[#ED6B23]/5 p-2.5 rounded-xl border border-[#2D2A70]/10">
            <span className="text-[10px] font-bold text-[#2D2A70] uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#ED6B23]" />
              Pertanyaan Cepat:
            </span>
            {[
              ...(originLocation && destinationLocation ? [
                `Adakah bottleneck dari ${originLocation.name || 'Titik A'} ke ${destinationLocation.name || 'Titik B'}, seberapa parah dan apa solusinya?`,
                `Simulasikan komparasi pengalaman komuter To-Be vs As-Is untuk rute ini`,
              ] : [
                'sebaiknya tambah halte di mana di sekitar Monas?',
                'bantu evaluasi halte baru di koridor Daan Mogot',
                'Bagaimana akses jalan kaki & potensi UMKM di titik ini?',
              ]),
            ].map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSend(prompt)}
                className="text-left text-[11px] text-[#1A1832] bg-white hover:border-[#ED6B23]/40 p-2 rounded-lg border border-[#E2E2EF] transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
              >
                <span>{prompt}</span>
                <ArrowRight className="w-3 h-3 text-[#6B6B8F] group-hover:text-[#ED6B23] transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        )}

        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          const isLatestAssistant = !isUser && idx === messages.length - 1;
          const isStreamingThis = isLatestAssistant && isLoading;

          // Jangan render bubble asisten jika konten masih kosong dan card progress status sedang aktif
          if (!isUser && !m.content && isLoading) {
            return null;
          }

          const detectedLocs = !isUser && !isLoading && m.content ? extractLocationsFromText(m.content) : [];
          const otherLocs = detectedLocs.filter(loc => !m.simulation || Math.abs(m.simulation.latitude - loc.latitude) > 0.001);

          return (
            <div
              key={idx}
              className={`rounded-2xl p-3 max-w-[90%] text-[12px] leading-[19px] ${
                isUser
                  ? 'bg-[#2D2A70] text-white self-end rounded-br-2xs shadow-xs'
                  : 'bg-[#F4F4FA] text-[#1A1832] self-start rounded-bl-2xs border border-[#E2E2EF]/60 shadow-2xs'
              }`}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap font-medium">{m.content}</p>
              ) : (
                <>
                  <div className="prose prose-sm max-w-none text-[12px] leading-[19px] text-[#1A1832] [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-1.5 [&_ul]:pl-4 [&_ol]:my-1.5 [&_ol]:pl-4 [&_li]:my-0.5 [&_strong]:text-[#2D2A70] [&_strong]:font-bold [&_code]:bg-[#E2E2EF] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_h1]:text-[13px] [&_h1]:font-bold [&_h2]:text-[12.5px] [&_h2]:font-bold [&_h3]:text-[12px] [&_h3]:font-bold [&_h3]:text-[#2D2A70]">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                    {isStreamingThis && (
                      <span className="inline-block w-1.5 h-3.5 bg-[#ED6B23] ml-1 animate-pulse align-middle rounded-xs" />
                    )}
                  </div>

                  {/* Rich Simulation Highlight Card jika AI memicu penempatan halte */}
                  {!isLoading && m.simulation && (
                    <div className="mt-2.5 p-2.5 bg-gradient-to-r from-[#2D2A70]/10 to-[#ED6B23]/10 border border-[#ED6B23]/30 rounded-xl flex flex-col gap-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#2D2A70] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#ED6B23]" />
                          Peta Diarahkan Otomatis ke Sini
                        </span>
                        <span className="text-[9px] bg-[#139A73] text-white font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
                          Akses {m.simulation.walk_accessibility?.score || 0}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-[#1A1832] font-semibold leading-tight">
                        📍 {m.simulation.stop_name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <button
                          onClick={() => onFocusLocation && onFocusLocation({
                            latitude: m.simulation!.latitude,
                            longitude: m.simulation!.longitude,
                            name: m.simulation!.stop_name,
                            zoom: 16,
                          })}
                          className="px-2 py-1 bg-white hover:bg-gray-50 border border-[#2D2A70]/20 text-[#2D2A70] text-[9.5px] font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <Compass className="w-3 h-3 text-[#ED6B23]" />
                          <span>Fokuskan Ulang Peta</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rich OD Trip Bottleneck & As-Is vs To-Be Simulation Card */}
                  {!isLoading && m.odTrip && (() => {
                    const isOptimal = m.odTrip.proposed_stop.action === 'none';
                    const activeTab = odTripStepTab[idx] || (isOptimal ? 'as_is' : 'to_be');
                    const stepsToShow = (activeTab === 'to_be' && !isOptimal) ? m.odTrip.to_be_journey.steps : m.odTrip.as_is_journey.steps;

                    return (
                      <div className="mt-2.5 p-3 bg-gradient-to-br from-[#2D2A70]/5 via-white to-[#ED6B23]/5 border border-[#2D2A70]/20 rounded-xl flex flex-col gap-2 shadow-2xs animate-in fade-in duration-200">
                        {/* Top status: Bottleneck Severity Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                              m.odTrip.bottleneck.severity === 'Kritis'
                                ? 'bg-red-500/15 text-red-700 border border-red-300'
                                : m.odTrip.bottleneck.severity === 'Sedang'
                                ? 'bg-amber-500/15 text-amber-800 border border-amber-300'
                                : 'bg-emerald-500/15 text-emerald-700 border border-emerald-300'
                            }`}>
                              {isOptimal ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3" />}
                              <span>{isOptimal ? 'Akses Transit: Optimal' : `Bottleneck: ${m.odTrip.bottleneck.severity}`}</span>
                            </span>
                          </div>
                          <span className="text-[9.5px] font-bold text-[#6B6B8F] bg-gray-100 px-2 py-0.5 rounded-md">
                            Skor Friksi: {m.odTrip.bottleneck.friction_score}/100
                          </span>
                        </div>

                        <p className="text-[11px] text-[#1A1832] font-semibold leading-tight">
                          📍 {m.odTrip.origin.name || 'Titik A'} → 🏁 {m.odTrip.destination.name || 'Titik B'}
                        </p>

                        {/* If stop is already optimal */}
                        {isOptimal ? (
                          <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-300 flex flex-col gap-1.5 mt-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10.5px] font-black text-emerald-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Layanan Halte Eksisting Sudah Optimal</span>
                              </span>
                              <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-extrabold uppercase">
                                Tidak Butuh Halte Baru
                              </span>
                            </div>
                            <p className="text-[9.5px] text-emerald-950/80 leading-snug">
                              {m.odTrip.proposed_stop.rationale}
                            </p>
                            <div className="flex items-center gap-3 pt-1 border-t border-emerald-200 text-[10px]">
                              <div className="flex items-center gap-1 text-emerald-900 font-bold">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                <span>~{m.odTrip.as_is_journey.total_duration_minutes} Menit</span>
                              </div>
                              <div className="flex items-center gap-1 text-emerald-800">
                                <Footprints className="w-3 h-3 text-emerald-600" />
                                <span>Jalan kaki {m.odTrip.as_is_journey.total_walk_distance_meters}m</span>
                              </div>
                              <div className="text-[9.5px] text-emerald-800">
                                Beban: <span className="font-bold">{m.odTrip.as_is_journey.pedestrian_strain_level}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* As-Is vs To-Be Comparison Grid */}
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {/* As-Is Box */}
                              <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 flex flex-col gap-1">
                                <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wide">
                                  Eksisting (As-Is)
                                </span>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-gray-800">
                                  <Clock className="w-3 h-3 text-gray-500" />
                                  <span>~{m.odTrip.as_is_journey.total_duration_minutes} Menit</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-gray-600">
                                  <Footprints className="w-3 h-3 text-gray-400" />
                                  <span>Jalan kaki {m.odTrip.as_is_journey.total_walk_distance_meters}m</span>
                                </div>
                                <div className="text-[9.5px] text-gray-500">
                                  Beban: <span className="font-semibold text-gray-700">{m.odTrip.as_is_journey.pedestrian_strain_level}</span>
                                </div>
                              </div>

                              {/* To-Be Box */}
                              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-300 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-wide">
                                    Usulan (To-Be)
                                  </span>
                                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-200/80 px-1 rounded">
                                    +{m.odTrip.efficiency_gain_percent}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-black text-emerald-800">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  <span>~{m.odTrip.to_be_journey.total_duration_minutes} Menit</span>
                                  <span className="text-[9.5px] font-bold text-emerald-700">(-{m.odTrip.delta_travel_time_minutes}m)</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                                  <Footprints className="w-3 h-3 text-emerald-500" />
                                  <span>Jalan kaki {m.odTrip.to_be_journey.total_walk_distance_meters}m</span>
                                </div>
                                <div className="text-[9.5px] text-emerald-800">
                                  Beban: <span className="font-bold">{m.odTrip.to_be_journey.pedestrian_strain_level}</span>
                                </div>
                              </div>
                            </div>

                            {/* Proposed Stop Callout */}
                            <div className="p-2 rounded-lg bg-[#ED6B23]/10 border border-[#ED6B23]/30 flex flex-col gap-1 mt-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#ED6B23] flex items-center gap-1">
                                  <Bus className="w-3 h-3" />
                                  <span>{m.odTrip.proposed_stop.stop_name}</span>
                                </span>
                                <span className="text-[9px] bg-[#ED6B23] text-white px-1.5 py-0.2 rounded font-bold uppercase">
                                  {m.odTrip.proposed_stop.action}
                                </span>
                              </div>
                              <p className="text-[9.5px] text-[#1A1832]/80 leading-snug">
                                {m.odTrip.proposed_stop.rationale}
                              </p>
                            </div>

                            {/* Action button to focus map */}
                            {m.odTrip.proposed_stop.latitude !== 0 && (
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => onFocusLocation && onFocusLocation({
                                    latitude: m.odTrip!.proposed_stop.latitude,
                                    longitude: m.odTrip!.proposed_stop.longitude,
                                    name: m.odTrip!.proposed_stop.stop_name,
                                    zoom: 16,
                                  })}
                                  className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-[#2D2A70]/30 text-[#2D2A70] text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                                >
                                  <Compass className="w-3 h-3 text-[#ED6B23]" />
                                  <span>Lihat Halte Rekomendasi di Peta</span>
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {/* Breakdown of Journey Steps */}
                        <div className="mt-1 border-t border-gray-200/80 pt-2 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-[#2D2A70] flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-[#ED6B23]" />
                              <span>Tahapan Rute Perjalanan:</span>
                            </span>
                            {!isOptimal && (
                              <div className="flex bg-gray-100 p-0.5 rounded-md text-[9px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => setOdTripStepTab(prev => ({ ...prev, [idx]: 'as_is' }))}
                                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                    activeTab === 'as_is' ? 'bg-white text-gray-900 shadow-2xs font-black' : 'text-gray-500 hover:text-gray-800'
                                  }`}
                                >
                                  As-Is
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOdTripStepTab(prev => ({ ...prev, [idx]: 'to_be' }))}
                                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                    activeTab === 'to_be' ? 'bg-emerald-600 text-white shadow-2xs font-black' : 'text-gray-500 hover:text-emerald-700'
                                  }`}
                                >
                                  To-Be
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Steps Render */}
                          <div className="flex flex-col gap-1.5 mt-0.5">
                            {stepsToShow && stepsToShow.length > 0 ? (
                              stepsToShow.map((step, sIdx) => {
                                const isWalk = step.mode === 'walk';
                                const isBus = step.mode === 'bus';
                                const isTransfer = step.mode === 'transfer';

                                return (
                                  <div
                                    key={sIdx}
                                    className={`p-2 rounded-lg border flex items-start gap-2 text-[10px] transition-all ${
                                      isWalk
                                        ? 'bg-amber-50/40 border-amber-200/80 text-amber-950'
                                        : isBus
                                        ? 'bg-indigo-50/40 border-indigo-200/80 text-indigo-950'
                                        : 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5 font-bold text-[9px] shadow-2xs bg-white text-gray-700 border border-gray-200">
                                      {isWalk ? (
                                        <Footprints className="w-2.5 h-2.5 text-amber-600" />
                                      ) : isBus ? (
                                        <Bus className="w-2.5 h-2.5 text-indigo-600" />
                                      ) : (
                                        <Shuffle className="w-2.5 h-2.5 text-emerald-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 flex flex-col min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="font-bold text-[10px] leading-tight text-gray-900 truncate">
                                          Tahap {step.step_number}: {step.title}
                                        </span>
                                        <span className="text-[8.5px] font-bold shrink-0 px-1 py-0.2 rounded bg-white border border-gray-200 text-gray-600">
                                          ~{step.duration_minutes}m ({step.distance_meters > 1000 ? `${(step.distance_meters / 1000).toFixed(1)}km` : `${Math.round(step.distance_meters)}m`})
                                        </span>
                                      </div>
                                      <p className="text-[9px] text-gray-600 leading-snug mt-0.5">
                                        {step.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-[9.5px] text-gray-400 italic">Rincian tahapan perjalanan tidak tersedia.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tombol Aksi Spasial untuk Titik Rekomendasi Terdeteksi */}
                  {!isLoading && otherLocs.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#E2E2EF]/60 flex flex-col gap-1.5">
                      <span className="text-[9.5px] font-bold text-[#2D2A70] flex items-center gap-1">
                        <Compass className="w-3 h-3 text-[#ED6B23]" />
                        Arahkan Peta ke Kandidat Rekomendasi:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {otherLocs.map((loc, lIdx) => (
                          <button
                            key={lIdx}
                            onClick={() => onFocusLocation && onFocusLocation({
                              latitude: loc.latitude,
                              longitude: loc.longitude,
                              name: loc.name,
                              zoom: 16,
                            })}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#2D2A70] hover:bg-[#1E1E3A] text-white text-[10px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-[#ED6B23]" />
                            <span>{loc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Telemetry badge untuk jawaban asisten yang sudah tuntas */}
                  {!isLoading && m.content && (
                    <div className="mt-2.5 pt-1.5 border-t border-[#E2E2EF]/60 flex items-center justify-between text-[9.5px] text-[#1A1832]/50 font-medium">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#139A73]" />
                        <span>PostGIS Spatial Analysis</span>
                      </span>
                      <span>Gemini 2.5 Active</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Dynamic Thought / Progress Feedback Card */}
        {isLoading && status && (
          <div className="bg-gradient-to-br from-white to-[#F8F8FC] border border-[#ED6B23]/30 shadow-xs rounded-xl p-3 max-w-[92%] self-start animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-[#ED6B23]/10 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-[#ED6B23] animate-spin" />
                </div>
                <span className="text-[11px] font-semibold text-[#2D2A70]">
                  LokaMaya AI • Tahap {status.step}/{status.total_steps}
                </span>
              </div>
              <span className="text-[9.5px] text-[#ED6B23] font-medium bg-[#ED6B23]/10 px-1.5 py-0.5 rounded-full">
                Memproses
              </span>
            </div>
            
            <p className="text-[11.5px] text-[#1A1832]/85 font-medium leading-tight flex items-center gap-1.5 mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ED6B23] animate-ping flex-shrink-0" />
              <span>{status.message}</span>
            </p>

            {/* Shimmering Progress Bar */}
            <div className="w-full bg-[#E2E2EF] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#2D2A70] to-[#ED6B23] h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(15, (status.step / status.total_steps) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Suggestion Chips & Prompt Starters */}
        {!isLoading && (
          <div className="flex flex-col gap-1.5 mt-2 animate-in fade-in duration-200">
            {messages.length <= 1 && (
              <span className="text-[10px] font-bold text-[#6B6B8F] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#ED6B23]" />
                <span>Pertanyaan Populer / Panduan Cepat:</span>
              </span>
            )}
            <div className="flex flex-wrap gap-1.5">
              {(suggestions.length > 0 ? suggestions : (messages.length <= 1 ? [
                "🚦 Analisis bottleneck perjalanan dari Titik A ke Titik B",
                "🚶 Cek jangkauan 5 & 10 menit jalan kaki (walkability)",
                "🏪 Potensi integrasi halte dengan UMKM sekitar",
                "🌧️ Evaluasi resiliensi halte terhadap risiko banjir",
              ] : [])).map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="px-2.5 py-1.5 bg-[#2D2A70]/5 hover:bg-[#2D2A70]/10 border border-[#2D2A70]/15 hover:border-[#2D2A70]/30 rounded-full text-[10px] font-semibold text-[#2D2A70] transition-all text-left shadow-2xs cursor-pointer active:scale-98"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 pt-2 mt-auto border-t border-[#E2E2EF]/60 bg-white">
        <div className="flex items-center bg-[#F4F4FA] border border-[#E2E2EF] focus-within:border-[#2D2A70]/50 rounded-xl px-2.5 py-[7px] gap-2 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              isLoading
                ? "AI sedang menyusun analisis spasial..."
                : contextLocation
                ? `Tanya seputar ${contextLocation.stop_name || "titik pin"}...`
                : "Tanya rekomendasi halte, dampak rute, dll..."
            }
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-[#1A1832] placeholder:text-[#1A1832]/45 disabled:opacity-60"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={handleStop}
              title="Hentikan generasi"
              aria-label="Hentikan pembuatan respons AI"
              className="w-[28px] h-[28px] bg-[#ED6B23] hover:bg-[#ED6B23]/90 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors shadow-xs group cursor-pointer"
            >
              <Square className="w-3 h-3 text-white fill-white group-hover:scale-110 transition-transform" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              title="Kirim pesan"
              aria-label="Kirim pesan ke asisten AI"
              className="w-[28px] h-[28px] bg-[#2D2A70] disabled:opacity-40 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-[#2D2A70]/90 transition-all shadow-xs cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
