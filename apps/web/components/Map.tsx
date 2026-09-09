'use client';

import { ReactNode, useEffect, useState } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapComponentProps {
  styleName?: 'street-v2.0' | 'satellite-v2.0' | 'dark-v2.0' | 'light-v2.0';
  className?: string;
  children?: ReactNode;
  targetLocation?: { latitude: number, longitude: number, zoom?: number } | null;
  selectedLocation?: { latitude: number, longitude: number } | null;
  onClick?: (evt: { lngLat: { lng: number; lat: number } }) => void;
}

export default function MapComponent({
  styleName = 'street-v2.0',
  className = "w-full h-full min-h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative",
  children,
  targetLocation,
  selectedLocation,
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
