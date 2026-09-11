'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Copy, Check, Printer, X, Download, ShieldCheck } from 'lucide-react';

interface PolicyBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  stopName: string;
  markdownContent: string;
}

export const PolicyBriefModal: React.FC<PolicyBriefModalProps> = ({
  isOpen,
  onClose,
  stopName,
  markdownContent,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E2EF] shadow-2xl rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2E2EF] bg-[#F8F8FC]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2D2A70] flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5 text-[#ED6B23]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-[#1A1832] leading-tight">
                  Naskah Advokasi Kebijakan (Policy Brief)
                </h3>
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#2D2A70]/10 text-[#2D2A70]">
                  Perda No. 1/2024
                </span>
              </div>
              <span className="text-[11px] text-[#6B6B8F]">{stopName}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#2D2A70] bg-white border border-[#E2E2EF] hover:bg-[#F4F4FA] rounded-xl transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Naskah</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-[#2D2A70] hover:bg-[#232057] rounded-xl transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#ED6B23]" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#6B6B8F] transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-[12px] text-[#1A1832] leading-relaxed bg-white font-sans print:p-0">
          <div className="border border-[#E2E2EF] rounded-2xl p-5 bg-[#FAFAFC] shadow-2xs">
            <div className="border-b-2 border-[#2D2A70] pb-3 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-extrabold text-[#2D2A70] tracking-tight uppercase">
                  Pemerintah Provinsi DKI Jakarta
                </h2>
                <span className="text-[10px] text-[#6B6B8F] font-medium tracking-wide uppercase">
                  Dinas Perhubungan &middot; Rekomendasi Teknis Penataan Fasilitas Transit
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Dokumen Terverifikasi</span>
              </div>
            </div>

            {/* Render formatted content */}
            <div className="prose prose-sm max-w-none text-[12px] leading-relaxed text-[#2D2D44] [&_h1]:text-[15px] [&_h1]:font-bold [&_h1]:text-[#2D2A70] [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:text-[#2D2A70] [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-[12px] [&_h3]:font-bold [&_h3]:text-[#1A1832] [&_h3]:mt-2.5 [&_h3]:mb-1 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:pl-4 [&_ol]:my-1.5 [&_ol]:pl-4 [&_li]:my-0.5 [&_hr]:my-3 [&_hr]:border-[#E2E2EF] [&_strong]:text-[#1A1832] [&_strong]:font-bold">
              <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E2E2EF] bg-[#F8F8FC] flex items-center justify-between text-[10px] text-[#6B6B8F]">
          <span>Format resmi siap serah untuk advokasi Forum Warga atau Musrenbang Pemprov DKI.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-gray-200 text-[#1A1832] font-semibold hover:bg-gray-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
