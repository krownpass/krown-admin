"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import api from "@/lib/api";

// Fix for default marker icon in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface HeatPoint {
  lat: number;
  lng: number;
  intensity?: number; // Optional intensity field
}

// Removed DUMMY_HEATMAP_DATA

function HeatLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    // Transform to [lat, lng, intensity]
    // The heatLayer expects array of [lat, lng, intensity]
    const heatPoints = points.map((p) => [
      Number(p.lat),
      Number(p.lng),
      p.intensity ? Number(p.intensity) : 0.5, 
    ]);

    // @ts-ignore - leaflet.heat extends L
    const heat = L.heatLayer(heatPoints, { radius: 25, minOpacity: 0.4 }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [points, map]);

  return null;
}

function HeatmapController({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: L.LatLngBounds) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
    },
  });

  // Initial fetch
  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  return null;
}

export default function UserHeatmap() {
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // We use useCallback to keep the function reference stable for the child component
  const fetchPoints = useCallback(async (bounds: L.LatLngBounds) => {
    try {
      setLoading(true);
      const params = {
        minLat: bounds.getSouth(),
        minLng: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLng: bounds.getEast(),
      };

      const res = await api.get("/krown/heatmap", { params });

      if (res.data) {
          // Backend returns: [{ lat: 12.34, lng: 56.78, intensity: 1 }, ...]
          setPoints(res.data);
      }

    } catch (err) {
      console.error("Failed to fetch heatmap data", err);
      // Fallback is empty on error now, no dummy data
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border relative z-0">
      <MapContainer
        center={[13.0827, 80.2707]} // Chennai default
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatLayer points={points} />
        <HeatmapController onBoundsChange={fetchPoints} />
      </MapContainer>
      
      {loading && (
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur px-3 py-1 rounded-md text-xs font-medium border shadow-sm z-[1000]">
          Updates..
        </div>
      )}
    </div>
  );
}
