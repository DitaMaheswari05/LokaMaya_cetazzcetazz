import { X, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { ChatMessageItem, SimulationResult } from '@/types/api';

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  contextLocation?: { latitude: number; longitude: number; stop_name?: string } | null;
  onSimulationTriggered?: (simulation: SimulationResult) => void;
}

export default function ChatWidget({
  isOpen,
  onClose,
  contextLocation,
  onSimulationTriggered,
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      role: 'assistant',
      content: 'Halo! Klik lokasi di peta atau tanya tentang analisis halte TransJakarta.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Kenapa skor UMKM rendah?',
    'Bandingkan halte terdekat',
    'Rute mana terputus?',
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessageItem = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const resp = await apiClient.sendChatMessage({
        message: text,
        context_location: contextLocation ? {
          latitude: contextLocation.latitude,
          longitude: contextLocation.longitude,
          stop_name: contextLocation.stop_name,
        } : undefined,
        history: nextMessages.map(m => ({ role: m.role, content: m.content })),
      });

      setMessages(prev => [...prev, { role: 'assistant', content: resp.message }]);

      if (resp.suggested_questions && resp.suggested_questions.length > 0) {
        setSuggestions(resp.suggested_questions);
      }

      if (resp.triggered_simulation && onSimulationTriggered) {
        onSimulationTriggered(resp.triggered_simulation);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Maaf, terjadi kesalahan saat menghubungi AI: ${err.message || 'Coba lagi beberapa saat lagi.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="absolute bottom-[80px] right-4 sm:right-6 z-30 w-[calc(100vw-32px)] sm:w-[350px] max-h-[480px] bg-white border border-[#E2E2EF] shadow-[0px_16px_48px_rgba(0,0,0,0.18)] rounded-[18px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#2D2A70]">
        <div className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] bg-[#ED6B23] rounded-full flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">AI</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-white leading-none">Asisten Peta</span>
            {contextLocation && (
              <span className="text-[10px] text-white/70 mt-0.5">
                Pin: {contextLocation.latitude.toFixed(4)}, {contextLocation.longitude.toFixed(4)}
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors flex items-center justify-center w-5 h-5">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body / Chat History */}
      <div className="flex flex-col p-3 gap-2 overflow-y-auto max-h-[300px]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-3 max-w-[85%] text-[12px] leading-[19px] ${
              m.role === 'user'
                ? 'bg-[#2D2A70] text-white self-end rounded-br-none'
                : 'bg-[#F4F4FA] text-[#1A1832] self-start rounded-bl-none'
            }`}
          >
            {m.content}
          </div>
        ))}

        {isLoading && (
          <div className="bg-[#F4F4FA] text-[#1A1832] rounded-xl p-3 max-w-[85%] self-start flex items-center gap-2 text-[12px]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ED6B23]" />
            <span>AI sedang menganalisis data spasial...</span>
          </div>
        )}

        {/* Suggestion Chips */}
        {!isLoading && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="px-2.5 py-1 bg-[#2D2A70]/5 border border-[#2D2A70]/15 rounded-full text-[10px] font-medium text-[#2D2A70] hover:bg-[#2D2A70]/10 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 pt-2 mt-auto border-t border-[#E2E2EF]/60 bg-white">
        <div className="flex items-center bg-[#F4F4FA] border border-[#E2E2EF] rounded-xl px-2.5 py-[7px] gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={contextLocation ? "Tanya tentang titik koordinat ini..." : "Tanya tentang halte TransJakarta..."}
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-[#1A1832] placeholder:text-[#1A1832]/50"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="w-[26px] h-[26px] bg-[#2D2A70] disabled:opacity-40 rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-opacity"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
