'use client';

import { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import Map, { MapRef, Marker, Source, Layer, NavigationControl, ScaleControl, Popup, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Compass, Bus, Route as RouteIcon, X, Sparkles, ArrowRightLeft, BarChart3 } from 'lucide-react';

import { RouteComparisonDetail, RouteStopItem, OptimalStopCandidate, ODTripAnalysisResult, ODLocation, GeoJSONFeatureCollection } from '@/types/api';

export interface SelectedStopDetail {
  name: string;
  corridor?: string;
  route_codes?: string;
  routes?: Array<{ code: string; name: string; corridor: string }>;
  lng: number;
  lat: number;
  is_brt?: boolean;
  sub_type?: string;
}

interface MapComponentProps {
  styleName?: 'street-v2.0' | 'satellite-v2.0' | 'dark-v2.0' | 'light-v2.0';
  className?: string;
  children?: ReactNode;
  targetLocation?: { latitude: number; longitude: number; zoom?: number; pitch?: number; bearing?: number; bounds?: [[number, number], [number, number]] } | null;
  selectedLocation?: { latitude: number; longitude: number } | null;
  originLocation?: ODLocation | null;
  destinationLocation?: ODLocation | null;
  odTripResult?: ODTripAnalysisResult | null;
  activeLayers?: Record<string, boolean>;
  layersData?: Record<string, GeoJSONFeatureCollection | Record<string, unknown>>;
  isochroneData?: GeoJSONFeatureCollection | Record<string, unknown> | null;
  routeComparison?: RouteComparisonDetail | null;
  optimalCandidates?: OptimalStopCandidate[];
  onSelectCandidate?: (candidate: OptimalStopCandidate) => void;
  onClick?: (evt: { lngLat: { lng: number; lat: number } }) => void;
  cursor?: string;
  selectedRouteCode?: string | null;
  onSelectRoute?: (routeCode: string | null) => void;
  selectedStop?: SelectedStopDetail | null;
  onSelectStop?: (stop: SelectedStopDetail | null) => void;
  onAskAiAboutStop?: (stop: SelectedStopDetail) => void;
  onSimulateStop?: (stop: SelectedStopDetail) => void;
  onMoveStop?: (stop: SelectedStopDetail) => void;
  relocationSourceStop?: SelectedStopDetail | null;
  onSetAsOrigin?: (loc: { latitude: number; longitude: number; name: string }) => void;
  onSetAsDestination?: (loc: { latitude: number; longitude: number; name: string }) => void;
}

export default function MapComponent({
  styleName = 'street-v2.0',
  className = "w-full h-full min-h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative",
  children,
  targetLocation,
  selectedLocation,
  originLocation,
  destinationLocation,
  odTripResult,
  activeLayers,
  layersData,
  isochroneData,
  routeComparison,
  optimalCandidates,
  onSelectCandidate,
  onClick,
  cursor,
  selectedRouteCode,
  onSelectRoute,
  selectedStop,
  onSelectStop,
  onAskAiAboutStop,
  onSimulateStop,
  onMoveStop,
  relocationSourceStop,
  onSetAsOrigin,
  onSetAsDestination,
}: MapComponentProps) {
  const mapIdApiKey = process.env.NEXT_PUBLIC_MAPID_API_KEY;
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pulseCoords, setPulseCoords] = useState<{ lat: number; lng: number } | null>(null);

  // State untuk hover halte TransJakarta
  const [hoveredStop, setHoveredStop] = useState<SelectedStopDetail | null>(null);

  // State untuk halte yang dipilih via click (menampilkan detail persisten yang bisa di-scroll)
  const [internalSelectedStop, setInternalSelectedStop] = useState<SelectedStopDetail | null>(null);
  const activeSelectedStop = selectedStop !== undefined ? selectedStop : internalSelectedStop;

  const changeSelectedStop = (stop: SelectedStopDetail | null) => {
    setInternalSelectedStop(stop);
    if (onSelectStop) {
      onSelectStop(stop);
    }
  };

  // Smooth flyTo camera movement when targetLocation is triggered by AI or interaction
  useEffect(() => {
    if (!targetLocation) return;
    if (mapRef.current) {
      if (targetLocation.bounds) {
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 640;
        mapRef.current.fitBounds(targetLocation.bounds, {
          padding: isDesktop
            ? { top: 90, bottom: 90, left: 400, right: 90 }
            : { top: 70, bottom: 120, left: 30, right: 30 },
          duration: 1800,
          essential: true,
          maxZoom: 14.5,
        });
        return;
      }

      mapRef.current.flyTo({
        center: [targetLocation.longitude, targetLocation.latitude],
        zoom: targetLocation.zoom || 15.5,
        pitch: targetLocation.pitch ?? 25,
        bearing: targetLocation.bearing ?? 0,
        duration: 1800,
        essential: true,
      });

      // Show animated radar ripple at the target location for visual clarity
      const pulseTimer = setTimeout(() => {
        setPulseCoords({ lat: targetLocation.latitude, lng: targetLocation.longitude });
      }, 50);
      const clearTimer = setTimeout(() => {
        setPulseCoords(null);
      }, 4550);
      return () => {
        clearTimeout(pulseTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [targetLocation, mapLoaded]);

  // Auto-fit camera view to encompass both Origin (A) and Destination (B) when an OD trip is analyzed
  useEffect(() => {
    if (!odTripResult || !originLocation || !destinationLocation || !mapRef.current) return;

    const minLng = Math.min(originLocation.longitude, destinationLocation.longitude);
    const maxLng = Math.max(originLocation.longitude, destinationLocation.longitude);
    const minLat = Math.min(originLocation.latitude, destinationLocation.latitude);
    const maxLat = Math.max(originLocation.latitude, destinationLocation.latitude);

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 640;
    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: isDesktop
          ? { top: 100, bottom: 100, left: 420, right: 100 }
          : { top: 80, bottom: 130, left: 40, right: 40 },
        duration: 1800,
        essential: true,
        maxZoom: 14.5,
      }
    );
  }, [odTripResult, originLocation, destinationLocation]);

  const targetLocationRef = useRef(targetLocation);
  useEffect(() => {
    targetLocationRef.current = targetLocation;
  }, [targetLocation]);

  // Gentle geolocation centering if no target has been set yet
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!targetLocationRef.current && mapRef.current) {
            mapRef.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 13.5,
              duration: 1500,
            });
          }
        },
        (error) => {
          console.warn("Geolocation skipped:", error.message);
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Handler hover pada layer stops-circle (hanya tooltip ringkas jika belum ada halte yang diklik)
  const handleMouseMove = useCallback((evt: MapLayerMouseEvent) => {
    if (activeSelectedStop) {
      setHoveredStop(null);
      return;
    }

    const feature = evt.features && evt.features.find((f: MapGeoJSONFeature) => f.layer.id === 'stops-circle');
    if (feature) {
      const props = (feature.properties || {}) as Record<string, unknown>;
      const geom = feature.geometry as { type: string; coordinates: [number, number] };
      const coords = geom.coordinates;
      setHoveredStop({
        name: typeof props.name === 'string' ? props.name : 'Halte TransJakarta',
        corridor: typeof props.corridor === 'string' ? props.corridor : undefined,
        route_codes: typeof props.route_codes === 'string' ? props.route_codes : undefined,
        lng: coords[0],
        lat: coords[1],
        is_brt: props.is_brt === true || props.is_brt === 'true',
        sub_type: typeof props.sub_type === 'string' ? props.sub_type : undefined,
      });
    } else {
      setHoveredStop(null);
    }
  }, [activeSelectedStop]);

  const handleMouseLeave = useCallback(() => {
    setHoveredStop(null);
  }, []);

  // Handler klik pada peta: jika halte diklik, buka detail persisten
  const handleInternalMapClick = (evt: MapLayerMouseEvent) => {
    const feature = evt.features && evt.features.find((f: MapGeoJSONFeature) => f.layer.id === 'stops-circle');
    if (feature) {
      const props = (feature.properties || {}) as Record<string, unknown>;
      let parsedRoutes: Array<{ code: string; name: string; corridor: string }> = [];
      if (typeof props.routes === 'string') {
        try {
          parsedRoutes = JSON.parse(props.routes);
        } catch {
          parsedRoutes = [];
        }
      } else if (Array.isArray(props.routes)) {
        parsedRoutes = props.routes as Array<{ code: string; name: string; corridor: string }>;
      }

      const geom = feature.geometry as { type: string; coordinates: [number, number] };
      const coords = geom.coordinates;
      const stopData: SelectedStopDetail = {
        name: typeof props.name === 'string' ? props.name : 'Halte TransJakarta',
        corridor: typeof props.corridor === 'string' ? props.corridor : undefined,
        route_codes: typeof props.route_codes === 'string' ? props.route_codes : undefined,
        routes: parsedRoutes,
        lng: coords[0],
        lat: coords[1],
        is_brt: props.is_brt === true || props.is_brt === 'true',
        sub_type: typeof props.sub_type === 'string' ? props.sub_type : undefined,
      };

      changeSelectedStop(stopData);
      setHoveredStop(null);
      return;
    }

    // Jika mengklik area kosong peta di luar halte:
    if (activeSelectedStop) {
      changeSelectedStop(null);
    }

    if (onClick) {
      onClick(evt);
    }
  };

  // Membentuk URL style MAPID atau fallback basemap publik jika API key belum diisi
  const isMapIdKeyConfigured = mapIdApiKey && mapIdApiKey !== 'your_mapid_api_key_here';
  const mapStyleUrl = isMapIdKeyConfigured
    ? `https://v2.basemap.mapid.io/styles/${styleName}/style.json?key=${mapIdApiKey}`
    : (styleName.includes('dark')
        ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json');

  return (
    <div className={className}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 106.8272, // Monas / Pusat Jakarta
          latitude: -6.1754,
          zoom: 12.5,
          pitch: 0,
          bearing: 0,
        }}
        onLoad={() => setMapLoaded(true)}
        onClick={handleInternalMapClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={['stops-circle']}
        cursor={hoveredStop || activeSelectedStop ? 'pointer' : (cursor || 'default')}
        mapStyle={mapStyleUrl}
        style={{ width: '100%', height: '100%' }}
        attributionControl={true}
      >
        {/* Navigation Controls: Zoom (+/-), Compass 3D Bearing */}
        <NavigationControl position="bottom-left" showCompass={true} visualizePitch={true} />
        <ScaleControl position="bottom-left" unit="metric" />

        {/* Pulsing Visual Radar Halo when AI directs map to a location */}
        {pulseCoords && (
          <Marker
            longitude={pulseCoords.lng}
            latitude={pulseCoords.lat}
            anchor="center"
          >
            <div className="relative flex items-center justify-center pointer-events-none -translate-x-1/2 -translate-y-1/2">
              <span className="absolute w-28 h-28 rounded-full bg-[#ED6B23]/25 animate-ping duration-1000" />
              <span className="absolute w-16 h-16 rounded-full bg-[#2D2A70]/20 animate-pulse" />
              <span className="w-8 h-8 rounded-full border-2 border-[#ED6B23] bg-white/50 shadow-lg flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-[#ED6B23] shadow-md" />
              </span>
            </div>
          </Marker>
        )}

        {/* Visual Halo Halte Asal saat Mode Relokasi Aktif */}
        {relocationSourceStop && (
          <Marker
            longitude={relocationSourceStop.lng}
            latitude={relocationSourceStop.lat}
            anchor="center"
          >
            <div className="relative flex items-center justify-center pointer-events-none -translate-x-1/2 -translate-y-1/2">
              <span className="absolute w-24 h-24 rounded-full bg-amber-500/30 animate-ping duration-1000" />
              <span className="absolute w-14 h-14 rounded-full bg-amber-500/20 animate-pulse" />
              <span className="px-2 py-0.5 rounded-full border-2 border-amber-400 bg-amber-600 text-white shadow-xl flex items-center justify-center font-bold text-[9px] whitespace-nowrap">
                Asal: {relocationSourceStop.name.slice(0, 15)}...
              </span>
            </div>
          </Marker>
        )}

        {/* Isochrone Walking Reach (5 & 10 min) */}
        {isochroneData && (
          <Source id="isochrone-source" type="geojson" data={isochroneData}>
            <Layer
              id="isochrone-layer-fill"
              type="fill"
              paint={{
                'fill-color': ['get', 'fill_color'],
                'fill-opacity': ['get', 'fill_opacity'],
              }}
            />
            <Layer
              id="isochrone-layer-line"
              type="line"
              paint={{
                'line-color': ['get', 'fill_color'],
                'line-width': 1.5,
              }}
            />
          </Source>
        )}

        {/* Zonasi RDTR 2022 */}
        {activeLayers?.rdtr && layersData?.rdtr && (
          <Source id="rdtr-source" type="geojson" data={layersData.rdtr}>
            <Layer
              id="rdtr-fill"
              type="fill"
              paint={{
                'fill-color': '#4E5167',
                'fill-opacity': 0.25,
              }}
            />
            <Layer
              id="rdtr-line"
              type="line"
              paint={{
                'line-color': '#4E5167',
                'line-width': 1.5,
              }}
            />
          </Source>
        )}

        {/* Rawan Banjir */}
        {activeLayers?.rawan_banjir && layersData?.rawan_banjir && (
          <Source id="flood-source" type="geojson" data={layersData.rawan_banjir}>
            <Layer
              id="flood-fill"
              type="fill"
              paint={{
                'fill-color': '#4184C9',
                'fill-opacity': 0.3,
              }}
            />
            <Layer
              id="flood-line"
              type="line"
              paint={{
                'line-color': '#2B6CB0',
                'line-width': 1.5,
                'line-dasharray': [3, 2],
              }}
            />
          </Source>
        )}

        {/* Rute As-Is (Eksisting) Hasil Simulasi */}
        {routeComparison?.as_is_geojson && (
          <Source id="route-as-is-source" type="geojson" data={routeComparison.as_is_geojson}>
            <Layer
              id="route-as-is-line"
              type="line"
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
              paint={{
                'line-color': '#2D2A70',
                'line-width': 4,
                'line-opacity': 0.7,
              }}
            />
          </Source>
        )}

        {/* Rute To-Be (Usulan Skenario) Hasil Simulasi */}
        {routeComparison?.to_be_geojson && (
          <Source id="route-to-be-source" type="geojson" data={routeComparison.to_be_geojson}>
            <Layer
              id="route-to-be-line"
              type="line"
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
              paint={{
                'line-color': '#ED6B23',
                'line-width': 4.5,
                'line-dasharray': [3, 2],
                'line-opacity': 0.95,
              }}
            />
          </Source>
        )}

        {/* Titik Halte dalam Lintasan Rute Simulasi */}
        {routeComparison?.to_be_stops && routeComparison.to_be_stops.length > 0 && (
          <Source
            id="route-stops-source"
            type="geojson"
            data={{
              type: "FeatureCollection",
              features: routeComparison.to_be_stops
                .filter((s: RouteStopItem) => s.latitude && s.longitude)
                .map((s: RouteStopItem) => ({
                  type: "Feature",
                  properties: {
                    name: s.name,
                    sequence: s.sequence,
                    status: s.status,
                    is_simulated: s.is_simulated,
                    color: s.status === 'added' ? '#ED6B23' : s.status === 'removed' ? '#EF4444' : s.status === 'relocated' ? '#F59E0B' : '#2D2A70',
                    radius: s.is_simulated ? 7 : 4,
                  },
                  geometry: {
                    type: "Point",
                    coordinates: [s.longitude, s.latitude],
                  },
                })),
            }}
          >
            <Layer
              id="route-stops-circle"
              type="circle"
              paint={{
                'circle-radius': ['get', 'radius'],
                'circle-color': ['get', 'color'],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
              }}
            />
          </Source>
        )}

        {/* Rute Koridor TransJakarta */}
        {activeLayers?.rute && layersData?.rute && (
          <Source id="routes-source" type="geojson" data={layersData.rute}>
            <Layer
              id="routes-line"
              type="line"
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
              paint={{
                'line-color': selectedRouteCode
                  ? [
                      'case',
                      [
                        'any',
                        ['==', ['get', 'corridor'], selectedRouteCode],
                        ['==', ['get', 'route_code'], selectedRouteCode],
                        ['==', ['get', 'corridor_code'], selectedRouteCode],
                        ['==', ['get', 'corridor_name'], selectedRouteCode],
                      ],
                      '#ED6B23',
                      '#94A3B8'
                    ]
                  : ['coalesce', ['get', 'color'], '#139A73'],
                'line-width': selectedRouteCode
                  ? [
                      'case',
                      [
                        'any',
                        ['==', ['get', 'corridor'], selectedRouteCode],
                        ['==', ['get', 'route_code'], selectedRouteCode],
                        ['==', ['get', 'corridor_code'], selectedRouteCode],
                        ['==', ['get', 'corridor_name'], selectedRouteCode],
                      ],
                      6,
                      2
                    ]
                  : 3.5,
                'line-opacity': selectedRouteCode
                  ? [
                      'case',
                      [
                        'any',
                        ['==', ['get', 'corridor'], selectedRouteCode],
                        ['==', ['get', 'route_code'], selectedRouteCode],
                        ['==', ['get', 'corridor_code'], selectedRouteCode],
                        ['==', ['get', 'corridor_name'], selectedRouteCode],
                      ],
                      1.0,
                      0.3
                    ]
                  : 0.85,
              }}
            />
          </Source>
        )}

        {/* Halte TransJakarta Eksisting */}
        {activeLayers?.transjakarta && layersData?.transjakarta && (
          <Source id="stops-source" type="geojson" data={layersData.transjakarta}>
            <Layer
              id="stops-circle"
              type="circle"
              paint={{
                'circle-radius': [
                  'case',
                  ['boolean', ['get', 'is_brt'], false],
                  6,
                  4
                ],
                'circle-color': [
                  'case',
                  ['boolean', ['get', 'is_brt'], false],
                  '#2D2A70',
                  '#505072'
                ],
                'circle-stroke-width': [
                  'case',
                  ['boolean', ['get', 'is_brt'], false],
                  2,
                  1.2
                ],
                'circle-stroke-color': '#FFFFFF',
              }}
            />
          </Source>
        )}

        {/* Sebaran UMKM (Struk & Menu Go) */}
        {activeLayers?.umkm && layersData?.umkm && (
          <Source id="umkm-source" type="geojson" data={layersData.umkm}>
            <Layer
              id="umkm-circle"
              type="circle"
              paint={{
                'circle-radius': 4.5,
                'circle-color': '#B95829',
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#FFFFFF',
                'circle-opacity': 0.85,
              }}
            />
          </Source>
        )}

        {/* Community Maps Aspirasi Warga */}
        {activeLayers?.community && layersData?.community && (
          <Source id="community-source" type="geojson" data={layersData.community}>
            <Layer
              id="community-circle"
              type="circle"
              paint={{
                'circle-radius': 5,
                'circle-color': '#7C3AED',
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#FFFFFF',
              }}
            />
          </Source>
        )}

        {/* OD Trip Visualization Layer (As-Is line & To-Be line) */}
        {odTripResult && odTripResult.route_geojson && (
          <Source id="od-trip-source" type="geojson" data={odTripResult.route_geojson}>
            {/* White outline/casing for high visibility against any basemap */}
            <Layer
              id="od-line-casing"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
              paint={{
                'line-color': '#FFFFFF',
                'line-width': 8.5,
                'line-opacity': 0.95,
              }}
            />
            {/* Jalur As-Is: Garis putus-putus indigo tegas */}
            <Layer
              id="od-as-is-line"
              type="line"
              filter={['==', ['get', 'type'], 'as_is_route']}
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
              paint={{
                'line-color': '#4F46E5',
                'line-width': 4.5,
                'line-dasharray': [3, 2],
                'line-opacity': 0.95,
              }}
            />
            {/* Jalur To-Be: Garis solid hijau emerald */}
            <Layer
              id="od-to-be-line"
              type="line"
              filter={['==', ['get', 'type'], 'to_be_route']}
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
              paint={{
                'line-color': '#10B981',
                'line-width': 5.5,
                'line-opacity': 0.95,
              }}
            />
          </Source>
        )}

        {/* Tooltip Ringkas saat di-hover (non-intrusive) */}
        {hoveredStop && !activeSelectedStop && (
          <Popup
            longitude={hoveredStop.lng}
            latitude={hoveredStop.lat}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={[0, -10]}
            className="z-40 pointer-events-none"
          >
            <div className="bg-[#1E1E3A]/90 text-white px-2.5 py-1.5 rounded-lg shadow-lg border border-white/15 backdrop-blur-md min-w-[150px] font-sans">
              <div className="flex items-center gap-1.5">
                <Bus className="w-3 h-3 text-[#ED6B23] shrink-0" />
                <span className="text-[11.5px] font-bold truncate max-w-[180px]">
                  {hoveredStop.name}
                </span>
                {hoveredStop.is_brt ? (
                  <span className="text-[8px] font-bold px-1 rounded bg-[#ED6B23] text-white">BRT</span>
                ) : (
                  <span className="text-[8px] font-medium px-1 rounded bg-white/20 text-white/80">Feeder</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5 text-[9px] text-white/60">
                <span className="truncate max-w-[110px]">{hoveredStop.corridor || 'TransJakarta'}</span>
                <span className="text-[#ED6B23] font-semibold ml-1 shrink-0">Klik untuk buka detail & rute</span>
              </div>
            </div>
          </Popup>
        )}

        {/* Detail Halte Persisten saat Halte Diklik */}
        {activeSelectedStop && (
          <Popup
            longitude={activeSelectedStop.lng}
            latitude={activeSelectedStop.lat}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={[0, -12]}
            className="z-50 pointer-events-auto"
          >
            <div className="bg-[#1E1E3A]/98 text-white p-3.5 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-lg min-w-[240px] max-w-[310px] font-sans">
              {/* Header with Title, Badge, and Close Button */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#2D2A70] border border-white/20 flex items-center justify-center shrink-0 mt-0.5 text-white shadow-xs">
                    <Bus className="w-3.5 h-3.5 text-[#ED6B23]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-[13px] font-bold text-white leading-tight">
                        {activeSelectedStop.name}
                      </h4>
                      {activeSelectedStop.is_brt ? (
                        <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#ED6B23] text-white">
                          Halte BRT
                        </span>
                      ) : (
                        <span className="text-[8.5px] font-medium px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
                          Bus Stop Feeder
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/60 block mt-0.5 truncate">
                      {activeSelectedStop.corridor || 'TransJakarta'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    changeSelectedStop(null);
                  }}
                  className="w-5 h-5 rounded-md hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer shrink-0 -mt-0.5"
                  title="Tutup detail"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rute yang Melewati (Scrollable) */}
              <div className="border-t border-white/10 pt-2.5 mt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1">
                    <RouteIcon className="w-3 h-3 text-[#ED6B23]" />
                    Rute yang Melewati:
                  </span>
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-white/15 text-[#ED6B23] font-bold">
                    {activeSelectedStop.routes && activeSelectedStop.routes.length > 0
                      ? `${activeSelectedStop.routes.length} Rute`
                      : (activeSelectedStop.route_codes ? `${activeSelectedStop.route_codes.split(',').length} Rute` : '1 Rute')}
                  </span>
                </div>

                {activeSelectedStop.routes && activeSelectedStop.routes.length > 0 ? (
                  <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-1 scroll-smooth">
                    {activeSelectedStop.routes.map((rt, rIdx) => (
                      <div
                        key={`stop-rt-${rt.code}-${rIdx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectRoute) {
                            onSelectRoute(selectedRouteCode === rt.code ? null : rt.code);
                          }
                        }}
                        className={`text-[10.5px] px-2.5 py-1.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          selectedRouteCode === rt.code
                            ? 'bg-[#ED6B23] text-white font-bold shadow-xs'
                            : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/5'
                        }`}
                        title="Klik untuk sorot rute ini di peta"
                      >
                        <span className="font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          Koridor {rt.code}
                        </span>
                        <span className="text-[9.5px] text-white/70 truncate max-w-[130px]">
                          {rt.corridor || rt.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : activeSelectedStop.route_codes ? (
                  <div className="flex flex-wrap gap-1">
                    {activeSelectedStop.route_codes.split(',').map((code: string, cIdx: number) => {
                      const cleanCode = code.trim();
                      return (
                        <button
                          key={`stop-code-${cleanCode}-${cIdx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectRoute) {
                              onSelectRoute(selectedRouteCode === cleanCode ? null : cleanCode);
                            }
                          }}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                            selectedRouteCode === cleanCode
                              ? 'bg-[#ED6B23] text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white/90'
                          }`}
                          title="Klik untuk sorot rute"
                        >
                          Koridor {cleanCode}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-[10px] text-white/50 italic">
                    Koridor 1 (Blok M - Kota) & rute pengumpan
                  </span>
                )}
              </div>

              {/* Action Buttons: Evaluasi, Pindahkan, & Tanya AI */}
              <div className="border-t border-white/10 pt-2.5 mt-2.5 grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSimulateStop) {
                      onSimulateStop(activeSelectedStop);
                    }
                  }}
                  className="px-1.5 py-1.5 bg-[#2D2A70] hover:bg-[#3D3A88] text-white rounded-lg text-[9.5px] font-bold flex items-center justify-center gap-1 border border-white/15 shadow-xs transition-colors cursor-pointer"
                  title="Audit performa akses pejalan kaki, UMKM, dan kelayakan halte eksisting ini"
                >
                  <BarChart3 className="w-3 h-3 text-[#ED6B23]" />
                  <span>Evaluasi</span>
                </button>
                {onMoveStop && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveStop(activeSelectedStop);
                    }}
                    className="px-1.5 py-1.5 bg-amber-600/90 hover:bg-amber-600 text-white rounded-lg text-[9.5px] font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                    title="Pilih halte ini untuk dipindahkan ke lokasi baru di peta"
                  >
                    <ArrowRightLeft className="w-3 h-3 text-white" />
                    <span>Pindah</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAskAiAboutStop) {
                      onAskAiAboutStop(activeSelectedStop);
                    }
                  }}
                  className="px-1.5 py-1.5 bg-gradient-to-r from-[#ED6B23] to-[#d65f1e] hover:brightness-110 text-white rounded-lg text-[9.5px] font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                  title="Bahas halte ini bersama AI Assistant"
                >
                  <Sparkles className="w-3 h-3 text-white" />
                  <span>Tanya AI</span>
                </button>
              </div>

              {/* Quick Setters untuk Rute Komuter (Titik A & Titik B) */}
              {(onSetAsOrigin || onSetAsDestination) && (
                <div className="pt-2 border-t border-white/10 flex items-center gap-1.5">
                  {onSetAsOrigin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetAsOrigin({
                          latitude: activeSelectedStop.lat,
                          longitude: activeSelectedStop.lng,
                          name: activeSelectedStop.name,
                        });
                      }}
                      className="flex-1 px-2 py-1.5 bg-[#10B981]/90 hover:bg-[#10B981] text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Tetapkan halte ini sebagai Titik Asal (A)"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-white text-[#10B981] flex items-center justify-center text-[9px] font-black">A</span>
                      <span>Titik Asal</span>
                    </button>
                  )}
                  {onSetAsDestination && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetAsDestination({
                          latitude: activeSelectedStop.lat,
                          longitude: activeSelectedStop.lng,
                          name: activeSelectedStop.name,
                        });
                      }}
                      className="flex-1 px-2 py-1.5 bg-[#EF4444]/90 hover:bg-[#EF4444] text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Tetapkan halte ini sebagai Titik Tujuan (B)"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-white text-[#EF4444] flex items-center justify-center text-[9px] font-black">B</span>
                      <span>Titik Tujuan</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </Popup>
        )}


        {selectedLocation && (
          <Marker
            longitude={selectedLocation.longitude}
            latitude={selectedLocation.latitude}
            anchor="bottom"
          >
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-[#ED6B23] border-2 border-white shadow-lg flex items-center justify-center animate-bounce">
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
              </div>
              <div className="w-2 h-2 bg-[#ED6B23] rotate-45 -mt-1" />
            </div>
          </Marker>
        )}

        {/* Titik Asal A (Origin Marker) */}
        {originLocation && (
          <Marker
            longitude={originLocation.longitude}
            latitude={originLocation.latitude}
            anchor="bottom"
          >
            <div className="flex flex-col items-center cursor-pointer group hover:scale-105 transition-transform">
              <div className="px-2.5 py-1 rounded-full bg-[#10B981] text-white font-black text-[11px] shadow-2xl border-2 border-white flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-white text-[#10B981] flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">A</span>
                <span className="text-[10.5px] font-bold max-w-[140px] truncate">{originLocation.name || 'Titik Asal'}</span>
              </div>
              <div className="w-2.5 h-2.5 bg-[#10B981] rotate-45 -mt-1 border-r border-b border-white" />
            </div>
          </Marker>
        )}

        {/* Titik Tujuan B (Destination Marker) */}
        {destinationLocation && (
          <Marker
            longitude={destinationLocation.longitude}
            latitude={destinationLocation.latitude}
            anchor="bottom"
          >
            <div className="flex flex-col items-center cursor-pointer group hover:scale-105 transition-transform">
              <div className="px-2.5 py-1 rounded-full bg-[#EF4444] text-white font-black text-[11px] shadow-2xl border-2 border-white flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-white text-[#EF4444] flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">B</span>
                <span className="text-[10.5px] font-bold max-w-[140px] truncate">{destinationLocation.name || 'Titik Tujuan'}</span>
              </div>
              <div className="w-2.5 h-2.5 bg-[#EF4444] rotate-45 -mt-1 border-r border-b border-white" />
            </div>
          </Marker>
        )}

        {/* Halte Usulan dari Hasil Analisis OD Trip */}
        {odTripResult && odTripResult.proposed_stop && odTripResult.proposed_stop.action !== 'none' && odTripResult.proposed_stop.latitude !== 0 && (
          <Marker
            longitude={odTripResult.proposed_stop.longitude}
            latitude={odTripResult.proposed_stop.latitude}
            anchor="bottom"
          >
            <div className="flex flex-col items-center cursor-pointer group hover:scale-115 transition-transform">
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#ED6B23] to-[#F59E0B] text-white font-black text-[11px] shadow-2xl border-2 border-white flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                <span>{odTripResult.proposed_stop.stop_name}</span>
              </div>
              <div className="w-2.5 h-2.5 bg-[#ED6B23] rotate-45 -mt-1 border-r border-b border-white" />
            </div>
          </Marker>
        )}

        {/* Rekomendasi Titik Pareto-Optimal (Inverse Spatial Exploration) */}
        {optimalCandidates && optimalCandidates.map((c) => {
          const isRank1 = c.rank === 1;
          const isRank2 = c.rank === 2;
          const badgeBg = isRank1 ? 'bg-amber-500 text-white border-amber-300' : isRank2 ? 'bg-slate-500 text-white border-slate-300' : 'bg-amber-800 text-white border-amber-600';
          const icon = isRank1 ? '🥇' : isRank2 ? '🥈' : '🥉';

          return (
            <Marker
              key={`opt-${c.rank}-${c.latitude}-${c.longitude}`}
              longitude={c.longitude}
              latitude={c.latitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (onSelectCandidate) onSelectCandidate(c);
              }}
            >
              <div className="flex flex-col items-center cursor-pointer group hover:scale-115 transition-transform">
                <div className={`px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 text-[9.5px] font-bold border-2 ${badgeBg}`}>
                  <span>{icon}</span>
                  <span className="whitespace-nowrap">{c.title.split(' ')[0]}</span>
                </div>
                <div className={`w-2 h-2 rotate-45 -mt-1 ${badgeBg.split(' ')[0]}`} />
              </div>
            </Marker>
          );
        })}
        {/* Quick Shortcut: Reset ke Pusat Jakarta / Monas */}
        <div className="absolute bottom-6 left-14 z-10 hidden sm:flex items-center gap-1.5 bg-white/90 backdrop-blur-xs border border-[#E2E2EF] shadow-md rounded-xl p-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              mapRef.current?.flyTo({
                center: [106.8272, -6.1754],
                zoom: 12.5,
                pitch: 0,
                bearing: 0,
                duration: 1500,
                essential: true,
              });
            }}
            className="px-2 py-1 text-[10px] font-semibold text-[#2D2A70] hover:bg-[#F4F4FA] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Kembali ke Jakarta Pusat / Monas"
          >
            <Compass className="w-3 h-3 text-[#ED6B23]" />
            <span>Pusat Jakarta</span>
          </button>
        </div>

        {children}
      </Map>
    </div>
  );
}
