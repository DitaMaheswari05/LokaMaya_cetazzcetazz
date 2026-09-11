'use client';

import React from 'react';
import { BehavioralRippleDetail } from '@/types/api';
import { Activity, Bike, Footprints, Store, TrendingUp, AlertTriangle } from 'lucide-react';

interface BehavioralRippleCardProps {
  data: BehavioralRippleDetail;
}

export const BehavioralRippleCard: React.FC<BehavioralRippleCardProps> = ({ data }) => {
  const ojolPercent = data.modal_shift_ojol_percent || 12;

  let shiftBadgeColor = 'text-green-700 bg-green-50 border-green-200';
  if (ojolPercent > 25) {
    shiftBadgeColor = 'text-red-700 bg-red-50 border-red-200';
  } else if (ojolPercent > 15) {
    shiftBadgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  return (
    <div className="bg-white border border-[#E2E2EF] rounded-2xl p-3.5 shadow-sm mt-3 flex flex-col gap-2.5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E2EF]/70 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2D2A70] flex items-center justify-center text-white shadow-xs">
            <Activity className="w-4 h-4 text-[#ED6B23]" />
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-[#1A1832] leading-tight">
              Prediksi Efek Domino Perilaku
            </h4>
            <span className="text-[9.5px] text-[#6B6B8F]">
              Proyeksi Pergeseran Moda & Ekonomi Mikro Sekitar
            </span>
          </div>
        </div>

        {/* Modal Shift Pill */}
        <div className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${shiftBadgeColor}`}>
          <Bike className="w-3.5 h-3.5" />
          <span>Ojol Shift: ~{ojolPercent}%</span>
        </div>
      </div>

      {/* Grid of 2 Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
        {/* Pedestrian Impact */}
        <div className="bg-[#F8F8FC] border border-[#E2E2EF] rounded-xl p-2.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-bold text-[#2D2A70]">
            <Footprints className="w-3.5 h-3.5 text-[#ED6B23]" />
            <span>Kenyamanan Pejalan Kaki</span>
          </div>
          <p className="text-[10px] text-[#1A1832] leading-snug">
            {data.walk_commuter_impact}
          </p>
        </div>

        {/* Informal Vendor Turnover */}
        <div className="bg-[#F8F8FC] border border-[#E2E2EF] rounded-xl p-2.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-bold text-[#B95829]">
            <Store className="w-3.5 h-3.5 text-[#ED6B23]" />
            <span>Omset Lapak & PKL Informal</span>
          </div>
          <p className="text-[10px] text-[#1A1832] leading-snug">
            {data.informal_vendor_turnover}
          </p>
        </div>
      </div>

      {/* Summary footnote */}
      {data.summary && (
        <span className="text-[9.5px] text-[#6B6B8F] italic leading-tight pt-1 border-t border-[#E2E2EF]/60">
          {data.summary}
        </span>
      )}
    </div>
  );
};
