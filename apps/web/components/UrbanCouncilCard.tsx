'use client';

import React, { useState } from 'react';
import { DeliberationResult } from '@/types/api';
import { Users, CheckCircle2, AlertCircle, Sparkles, MessageSquare, ChevronDown, ChevronUp, Scale } from 'lucide-react';

interface UrbanCouncilCardProps {
  deliberation: DeliberationResult;
}

export const UrbanCouncilCard: React.FC<UrbanCouncilCardProps> = ({ deliberation }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const rate = deliberation.social_acceptance_rate;
  let rateColor = 'text-green-600 bg-green-50 border-green-200';
  let barColor = 'bg-gradient-to-r from-green-500 to-emerald-600';
  if (rate < 60) {
    rateColor = 'text-red-600 bg-red-50 border-red-200';
    barColor = 'bg-gradient-to-r from-red-500 to-rose-600';
  } else if (rate < 80) {
    rateColor = 'text-amber-600 bg-amber-50 border-amber-200';
    barColor = 'bg-gradient-to-r from-amber-500 to-yellow-500';
  }

  // Persona icons & avatar badge colors
  const getPersonaBadge = (persona: string) => {
    if (persona.includes('Rina')) {
      return { label: 'Warga', bg: 'bg-indigo-600', icon: '👩' };
    }
    if (persona.includes('Siti')) {
      return { label: 'UMKM', bg: 'bg-amber-600', icon: '🏪' };
    }
    return { label: 'Dishub', bg: 'bg-blue-700', icon: '👔' };
  };

  const getStancePill = (stance: string) => {
    const sLower = stance.toLowerCase();
    if (sLower.includes('mendukung') && !sLower.includes('bersyarat')) {
      return (
        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          {stance}
        </span>
      );
    }
    if (sLower.includes('bersyarat')) {
      return (
        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {stance}
        </span>
      );
    }
    return (
      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {stance}
      </span>
    );
  };

  return (
    <div className="bg-white border border-[#E2E2EF] rounded-2xl p-3.5 shadow-sm mt-3 flex flex-col gap-3 transition-all">
      {/* Header: Title & Consensus Rate */}
      <div className="flex items-center justify-between border-b border-[#E2E2EF]/70 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2D2A70] flex items-center justify-center text-white shadow-xs">
            <Users className="w-4 h-4 text-[#ED6B23]" />
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-[#1A1832] flex items-center gap-1.5">
              AI Urban Council
              <span className="text-[10px] font-normal text-[#6B6B8F]">(Musyawarah 3 Persona)</span>
            </h4>
            <span className="text-[9.5px] text-[#6B6B8F]">
              Tingkat Konsensus: <strong className="text-[#1A1832]">{deliberation.consensus_level}</strong>
            </span>
          </div>
        </div>

        {/* Social Acceptance Meter Pill */}
        <div className={`flex flex-col items-end px-2.5 py-1 rounded-xl border ${rateColor}`}>
          <span className="text-[9px] font-medium leading-none uppercase tracking-wider">Social Acceptance</span>
          <span className="text-[15px] font-extrabold leading-tight">{rate}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#E2E2EF]/60 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${rate}%` }} />
      </div>

      {/* Toggle button */}
      <div className="flex items-center justify-between text-[10px] text-[#6B6B8F]">
        <span>Pandangan 3 Pemangku Kepentingan:</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-0.5 font-semibold text-[#2D2A70] hover:underline"
        >
          {isExpanded ? (
            <>
              <span>Ringkas</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Lihat Detail</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Stakeholders Cards */}
      {isExpanded && (
        <div className="flex flex-col gap-2">
          {deliberation.stakeholders.map((sh, idx) => {
            const badge = getPersonaBadge(sh.persona);
            return (
              <div
                key={idx}
                className="bg-[#F8F8FC] border border-[#E2E2EF] rounded-xl p-2.5 flex flex-col gap-1.5 hover:border-[#2D2A70]/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px]">{badge.icon}</span>
                    <span className="text-[11px] font-bold text-[#1A1832]">{sh.persona}</span>
                    <span className="text-[9.5px] text-[#6B6B8F]">({sh.role})</span>
                  </div>
                  {getStancePill(sh.stance)}
                </div>

                <p className="text-[10.5px] text-[#1A1832] italic leading-relaxed pl-2 border-l-2 border-[#2D2A70]/20 bg-white/60 p-1.5 rounded-r-lg">
                  "{sh.quote}"
                </p>

                {sh.key_reason && (
                  <span className="text-[9.5px] text-[#6B6B8F] leading-tight">
                    <strong className="text-[#2D2A70]">Fokus Utama:</strong> {sh.key_reason}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Compromise Solution Box */}
      {deliberation.compromise_solution && (
        <div className="bg-gradient-to-br from-[#2D2A70]/5 to-[#ED6B23]/10 border border-[#ED6B23]/25 rounded-xl p-2.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2D2A70]">
            <Scale className="w-3.5 h-3.5 text-[#ED6B23]" />
            <span>Rekomendasi Solusi Kompromi (Jalan Tengah)</span>
          </div>
          <p className="text-[10.5px] text-[#1A1832] leading-relaxed">
            {deliberation.compromise_solution}
          </p>
        </div>
      )}
    </div>
  );
};
