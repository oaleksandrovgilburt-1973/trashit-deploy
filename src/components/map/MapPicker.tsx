'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

// Set Mapbox token - using a placeholder that should be replaced with actual token
mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbHZkdDNqMWEifQ.placeholder';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

export default function MapPicker({
  onLocationSelect,
  initialLat = 42.6977,
  initialLng = 23.3219,
  initialAddress = 'София, България',
}: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [address, setAddress] = useState(initialAddress);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLng, initialLat],
      zoom: 12,
    });

    // Add marker
    marker.current = new mapboxgl.Marker({
      color: '#10b981',
      draggable: true,
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    // Handle marker drag
    const onDragEnd = () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        reverseGeocode(lngLat.lat, lngLat.lng);
      }
    };

    marker.current.on('dragend', onDragEnd);

    // Handle map click
    const onMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (marker.current) {
        marker.current.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        reverseGeocode(e.lngLat.lat, e.lngLat.lng);
      }
    };

    map.current.on('click', onMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', onMapClick);
        if (marker.current) {
          marker.current.off('dragend', onDragEnd);
        }
        map.current.remove();
      }
    };
  }, [initialLat, initialLng]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      // Using a simple geocoding service (you can replace with Mapbox Geocoding API)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();

      const newAddress = data.address?.road
        ? `${data.address.road}, ${data.address.city || 'София'}`
        : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      setAddress(newAddress);
      onLocationSelect(lat, lng, newAddress);
    } catch (error) {
      console.error('Geocoding error:', error);
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      onLocationSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Локация на заявката
      </label>

      {/* Map Container */}
      <div
        ref={mapContainer}
        className="w-full h-80 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden"
      />

      {/* Address Display */}
      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Избрана локация
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {loading ? 'Зареждане на адрес...' : address}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Кликнете на картата или превлачете маркера, за да изберете локация
      </p>
    </div>
  );
}
