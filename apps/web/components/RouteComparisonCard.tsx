'use client';

import React, { useState } from 'react';
import { RouteComparisonDetail, RouteStopItem } from '@/types/api';
import { Bus, ChevronDown, ChevronUp, Clock, Route as RouteIcon, Sparkles } from 'lucide-react';

interface RouteComparisonCardProps {
  data: RouteComparisonDetail;
  onSelectStop?: (stop: RouteStopItem) => void;
}

export const RouteComparisonCard: React.FC<RouteComparisonCardProps> = ({ data, onSelectStop }) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'to_be' | 'as_is'>('diff');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Fallbacks
  const routeCode = data.primary_route_code || 'BRT';
  const corridorName = data.primary_route_name || data.affected_corridor || 'TransJakarta';
  const otherRoutes = (data.all_affected_routes || []).filter((c) => c !== routeCode);
  const asIsStops = data.as_is_stops || [];
  const toBeStops = data.to_be_stops || [];

  // Determine the display stops based on activeTab
  const currentStops: RouteStopItem[] = activeTab === 'as_is' ? asIsStops : toBeStops;

  // Find index of the simulated stop
  const simIndex = currentStops.findIndex((s) => s.is_simulated || s.status !== 'existing');

  // If collapsed, slice a window around the modified stop (e.g. 2 stops before, 2 stops after)
  let displayedStops = currentStops;
  if (!isExpanded && currentStops.length > 6) {
    if (simIndex !== -1) {
      const start = Math.max(0, simIndex - 2);
      const end = Math.min(currentStops.length, simIndex + 3);
      displayedStops = currentStops.slice(start, end);
    } else {
      displayedStops = currentStops.slice(0, 5);
    }
  }

  return (
    <div className="bg-white border border-[#E2E2EF] rounded-2xl p-3.5 shadow-sm mt-3 flex flex-col gap-2.5 transition-all">
      {/* Header: BRT Route Badge & Title */}
      <div className="flex items-start justify-between gap-2 border-b border-[#E2E2EF]/70 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="bg-[#2D2A70] text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
            <Bus className="w-3.5 h-3.5 text-[#ED6B23]" />
            <span className="text-[12px] font-bold tracking-tight">RUTE {routeCode}</span>
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-[#1A1832] leading-tight">
              {corridorName}
            </h4>
            {data.direction && (
              <span className="text-[10px] text-[#6B6B8F] flex items-center gap-1 mt-0.5">
                <RouteIcon className="w-3 h-3 text-[#6B6B8F]" />
                {data.direction}
              </span>
            )}
          </div>
        </div>

        {/* Legend / Status Pill */}
        <span className="text-[10px] font-semibold text-[#ED6B23] bg-[#ED6B23]/10 px-2 py-0.5 rounded-full border border-[#ED6B23]/20">
          To-Be vs As-Is
        </span>
      </div>

      {/* Other Affected Corridors */}
      {otherRoutes.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#6B6B8F]">Koridor lain terhubung:</span>
          {otherRoutes.slice(0, 4).map((c, idx) => (
            <span
              key={`other-rt-${c}-${idx}`}
              className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#F4F4FA] text-[#2D2A70] border border-[#E2E2EF]"
            >
              +{c}
            </span>
          ))}
        </div>
      )}

      {/* Changed Segment Banner */}
      {data.changed_segment && (
        <div className="bg-gradient-to-r from-[#2D2A70]/5 via-[#ED6B23]/10 to-transparent border-l-2 border-[#ED6B23] rounded-r-lg p-2 flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-[#2D2A70] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#ED6B23]" />
            Segmen Perubahan Rute:
          </span>
          <span className="text-[11px] font-medium text-[#1A1832] leading-snug">
            {data.changed_segment}
          </span>
        </div>
      )}

      {/* Metrics Δ Grid */}
      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
        <div className="bg-[#F8F8FC] border border-[#E2E2EF] p-2 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#6B6B8F]">
            <RouteIcon className="w-3.5 h-3.5 text-[#2D2A70]" />
            <span>Δ Jarak Rute</span>
          </div>
          <strong className={`font-bold ${data.delta_distance_meters > 0 ? 'text-[#ED6B23]' : 'text-[#139A73]'}`}>
            {data.delta_distance_meters > 0 ? `+${data.delta_distance_meters}m` : `${data.delta_distance_meters}m`}
          </strong>
        </div>

        <div className="bg-[#F8F8FC] border border-[#E2E2EF] p-2 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#6B6B8F]">
            <Clock className="w-3.5 h-3.5 text-[#2D2A70]" />
            <span>Δ Waktu Tempuh</span>
          </div>
          <strong className={`font-bold ${data.delta_travel_time_minutes > 0 ? 'text-[#ED6B23]' : 'text-[#139A73]'}`}>
            {data.delta_travel_time_minutes > 0 ? `+${data.delta_travel_time_minutes} min` : `${data.delta_travel_time_minutes} min`}
          </strong>
        </div>
      </div>

      {/* Stepper View Tabs */}
      <div className="flex items-center gap-1 bg-[#F4F4FA] p-1 rounded-xl border border-[#E2E2EF] text-[10px]">
        <button
          onClick={() => setActiveTab('diff')}
          className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
            activeTab === 'diff'
              ? 'bg-white text-[#2D2A70] shadow-xs'
              : 'text-[#6B6B8F] hover:text-[#1A1832]'
          }`}
        >
          Urutan Perubahan (Diff)
        </button>
        <button
          onClick={() => setActiveTab('as_is')}
          className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
            activeTab === 'as_is'
              ? 'bg-white text-[#2D2A70] shadow-xs'
              : 'text-[#6B6B8F] hover:text-[#1A1832]'
          }`}
        >
          As-Is ({asIsStops.length} Halte)
        </button>
        <button
          onClick={() => setActiveTab('to_be')}
          className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
            activeTab === 'to_be'
              ? 'bg-white text-[#ED6B23] shadow-xs'
              : 'text-[#6B6B8F] hover:text-[#1A1832]'
          }`}
        >
          To-Be ({toBeStops.length} Halte)
        </button>
      </div>

      {/* Sequential Stop Timeline / Stepper */}
      <div className="relative pl-3 border-l-2 border-[#E2E2EF] ml-3 py-1 flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
        {!isExpanded && currentStops.length > 6 && simIndex > 2 && (
          <div className="text-[9.5px] text-[#6B6B8F] italic py-0.5">
            ... {simIndex - 2} halte sebelumnya ...
          </div>
        )}

        {displayedStops.map((stop, idx) => {
          const isAdded = stop.status === 'added';
          const isRemoved = stop.status === 'removed';
          const isRelocated = stop.status === 'relocated';
          const isModified = isAdded || isRemoved || isRelocated;

          return (
            <div
              key={`${stop.name}-${stop.sequence}-${idx}`}
              onClick={() => onSelectStop && onSelectStop(stop)}
              className={`group flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                isModified
                  ? 'bg-[#ED6B23]/10 border border-[#ED6B23]/30'
                  : 'hover:bg-[#F4F4FA]'
              }`}
            >
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-[19px] w-3 h-3 rounded-full border-2 border-white transition-transform group-hover:scale-110 ${
                  isAdded
                    ? 'bg-[#ED6B23] ring-2 ring-[#ED6B23]/30'
                    : isRemoved
                    ? 'bg-red-500 ring-2 ring-red-200'
                    : isRelocated
                    ? 'bg-amber-500 ring-2 ring-amber-200'
                    : 'bg-[#2D2A70]'
                }`}
              />

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-[#6B6B8F] w-4">
                  {stop.sequence}.
                </span>
                <span
                  className={`text-[11px] font-medium leading-tight ${
                    isAdded
                      ? 'text-[#ED6B23] font-bold'
                      : isRemoved
                      ? 'text-red-500 line-through'
                      : isRelocated
                      ? 'text-amber-700 font-bold'
                      : 'text-[#1A1832]'
                  }`}
                >
                  {stop.name}
                </span>
              </div>

              {/* Status Tags */}
              {isAdded && (
                <span className="text-[9px] font-bold bg-[#ED6B23] text-white px-1.5 py-0.5 rounded shadow-xs">
                  BARU
                </span>
              )}
              {isRemoved && (
                <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                  DITUTUP
                </span>
              )}
              {isRelocated && (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  GESER
                </span>
              )}
            </div>
          );
        })}

        {!isExpanded && currentStops.length > 6 && simIndex < currentStops.length - 3 && (
          <div className="text-[9.5px] text-[#6B6B8F] italic py-0.5">
            ... {currentStops.length - (simIndex + 3)} halte berikutnya ...
          </div>
        )}
      </div>

      {/* Expand/Collapse Button */}
      {currentStops.length > 6 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1 py-1 text-[10px] font-semibold text-[#2D2A70] hover:bg-[#F4F4FA] rounded-lg transition-colors border border-dashed border-[#E2E2EF]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Tutup Rute Penuh
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Lihat Seluruh Rute ({currentStops.length} Halte)
            </>
          )}
        </button>
      )}

      {/* Narrative summary footer */}
      {data.summary && (
        <span className="text-[9.5px] text-[#6B6B8F] italic leading-tight pt-1 border-t border-[#E2E2EF]/60">
          {data.summary}
        </span>
      )}
    </div>
  );
};
