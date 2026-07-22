import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/**
 * Simple Leaflet map for a single lat/lng marker (live tracking).
 */
export default function LiveMap({ lat, lng, height = 280, label = 'Driver' }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || lat == null || lng == null) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(mapInstance.current);
      markerRef.current = L.marker([lat, lng], { icon: defaultIcon })
        .addTo(mapInstance.current)
        .bindPopup(label);
    } else {
      mapInstance.current.setView([lat, lng]);
      markerRef.current.setLatLng([lat, lng]);
    }

    return () => {
      // keep map across updates; destroy on unmount only
    };
  }, [lat, lng, label]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  if (lat == null || lng == null) {
    return (
      <div
        style={{
          height,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--bg-soft)',
          borderRadius: 12,
          color: 'var(--text-soft)',
        }}
      >
        Waiting for live location…
      </div>
    );
  }

  return <div ref={mapRef} style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden' }} />;
}
