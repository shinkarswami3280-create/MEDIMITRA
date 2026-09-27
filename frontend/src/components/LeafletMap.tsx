import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  isPickup?: boolean;
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [19.0760, 72.8777], // Default: Mumbai coordinates
  zoom = 12,
  markers = [],
  onLocationSelect,
  height = '350px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Fix default leaflet marker icon asset path in Vite
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = layerGroup;
      mapInstanceRef.current = map;

      if (onLocationSelect) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng]);
      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <strong>${m.title}</strong>
          ${m.subtitle ? `<br/><span style="color: #64748b;">${m.subtitle}</span>` : ''}
          ${m.isPickup ? '<br/><span style="color: #0284c7; font-weight: 600;">[Your Pickup Location]</span>' : ''}
        </div>
      `;
      marker.bindPopup(popupContent);
      markersLayerRef.current?.addLayer(marker);
    });

    if (markers.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [markers]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-xs">
      <div ref={mapContainerRef} style={{ height }} />
      {onLocationSelect && (
        <div className="absolute top-2 right-2 z-1000 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 shadow-sm border border-slate-200">
          📍 Click on map to select pickup point
        </div>
      )}
    </div>
  );
};
