'use client';

import { ReactNode, useEffect, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapComponentProps {
  styleName?: 'street-v2.0' | 'satellite-v2.0' | 'dark-v2.0' | 'light-v2.0';
  className?: string;
  children?: ReactNode;
  targetLocation?: { latitude: number, longitude: number, zoom?: number } | null;
  selectedLocation?: { latitude: number, longitude: number } | null;
  activeLayers?: Record<string, boolean>;
  layersData?: Record<string, any>;
  isochroneData?: any;
  onClick?: (evt: { lngLat: { lng: number; lat: number } }) => void;
}

export default function MapComponent({
  styleName = 'street-v2.0',
  className = "w-full h-full min-h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative",
  children,
  targetLocation,
  selectedLocation,
  activeLayers,
  layersData,
  isochroneData,
  onClick,
}: MapComponentProps) {
  const mapIdApiKey = process.env.NEXT_PUBLIC_MAPID_API_KEY;

  const [viewState, setViewState] = useState({
    longitude: 118.0, // Center of Indonesia
    latitude: -2.0,
    zoom: 5,
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setViewState({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            zoom: 13, // Closer zoom when user location is found
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (targetLocation) {
      setViewState((prev) => ({
        ...prev,
        latitude: targetLocation.latitude,
        longitude: targetLocation.longitude,
        zoom: targetLocation.zoom || 14,
      }));
    }
  }, [targetLocation]);

  // Membentuk URL style sesuai dengan props atau default (dark-v2.0)
  const mapStyleUrl = `https://v2.basemap.mapid.io/styles/${styleName}/style.json?key=${mapIdApiKey}`;
  // https://v2.basemap.mapid.io/styles/{style-name}/style.json?key=[API Key]

  return (
    <div className={className}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={onClick}
        mapStyle={mapStyleUrl}
        style={{ width: '100%', height: '100%' }}
        attributionControl={true}
      >
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

        {/* Rute Koridor TransJakarta */}
        {activeLayers?.rute && layersData?.rute && (
          <Source id="routes-source" type="geojson" data={layersData.rute}>
            <Layer
              id="routes-line"
              type="line"
              paint={{
                'line-color': ['coalesce', ['get', 'color'], '#139A73'],
                'line-width': 3.5,
                'line-opacity': 0.85,
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
                'circle-radius': 5,
                'circle-color': '#2D2A70',
                'circle-stroke-width': 2,
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
        {children}
      </Map>
    </div>
  );
}
