'use client';

import { ReactNode, useEffect, useState } from 'react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapComponentProps {
  styleName?: 'street-v2.0' | 'satellite-v2.0' | 'dark-v2.0' | 'light-v2.0';
  className?: string;
  children?: ReactNode;
  targetLocation?: { latitude: number, longitude: number, zoom?: number } | null;
}

export default function MapComponent({
  styleName = 'street-v2.0',
  className = "w-full h-full min-h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative",
  children,
  targetLocation
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
        mapStyle={mapStyleUrl}
        style={{ width: '100%', height: '100%' }}
        attributionControl={true}
      >
        {children}
      </Map>
    </div>
  );
}
