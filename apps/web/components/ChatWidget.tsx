import { X, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatWidget({ isOpen, onClose }: ChatWidgetProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-[80px] right-4 sm:right-6 z-30 w-[calc(100vw-32px)] sm:w-[320px] bg-white border border-[#E2E2EF] shadow-[0px_16px_48px_rgba(0,0,0,0.18)] rounded-[18px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#2D2A70]">
        <div className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] bg-[#ED6B23] rounded-full flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">AI</span>
          </div>
          <span className="text-[13px] font-semibold text-white">Asisten Peta</span>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors flex items-center justify-center w-5 h-5">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col p-3 gap-2">
        <div className="bg-[#F4F4FA] rounded-xl p-3 max-w-[85%]">
          <p className="text-[12px] text-[#1A1832] leading-[19px]">
            Halo! Klik lokasi di peta atau tanya tentang analisis halte TransJakarta.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <button className="px-2.5 py-1.5 bg-[#2D2A70]/5 border border-[#2D2A70]/15 rounded-full text-[10px] font-medium text-[#2D2A70] hover:bg-[#2D2A70]/10 transition-colors">
            Kenapa skor UMKM rendah?
          </button>
          <button className="px-2.5 py-1.5 bg-[#2D2A70]/5 border border-[#2D2A70]/15 rounded-full text-[10px] font-medium text-[#2D2A70] hover:bg-[#2D2A70]/10 transition-colors">
            Bandingkan halte terdekat
          </button>
          <button className="px-2.5 py-1.5 bg-[#2D2A70]/5 border border-[#2D2A70]/15 rounded-full text-[10px] font-medium text-[#2D2A70] hover:bg-[#2D2A70]/10 transition-colors">
            Rute mana terputus?
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 pt-4 mt-auto">
        <div className="flex items-center bg-[#F4F4FA] border border-[#E2E2EF] rounded-xl px-2.5 py-[7px] gap-2">
          <input 
            type="text" 
            placeholder="Tanya tentang lokasi ini..." 
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-[#1A1832] placeholder:text-[#1A1832]/50"
          />
          <button className="w-[26px] h-[26px] bg-[#2D2A70] rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-opacity">
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
