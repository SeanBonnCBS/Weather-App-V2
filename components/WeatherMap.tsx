"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Place = { name: string; latitude: number; longitude: number };
const marker = L.divIcon({ className: "weather-pin", html: "<span class=\"weather-pin-pulse\"></span><span class=\"weather-pin-core\"></span>", iconSize: [32, 32], iconAnchor: [16, 16] });

function Recenter({ place }: { place: Place }) {
  const map = useMap();
  useEffect(() => { map.setView([place.latitude, place.longitude], Math.max(map.getZoom(), 7), { animate: true }); }, [map, place]);
  return null;
}

export default function WeatherMap({ place }: { place: Place }) {
  const [frames, setFrames] = useState<Array<{ path: string; time: number }>>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const refreshRadar = () => fetch("https://api.rainviewer.com/public/weather-maps.json", { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("Radar request failed"); return response.json(); }).then((data) => {
        const available = [...(data.radar?.past || []), ...(data.radar?.nowcast || [])]
          .filter((frame) => frame?.path && data.host)
          .map((frame) => ({ path: `${data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, time: frame.time }));
        setFrames(available); setFrameIndex(Math.max(0, available.length - 1));
      }).catch(() => setFrames([]));
    refreshRadar(); const id = window.setInterval(refreshRadar, 300000); return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const timer = window.setInterval(() => setFrameIndex((index) => (index + 1) % frames.length), 700);
    return () => window.clearInterval(timer);
  }, [playing, frames.length]);
  const radar = frames[frameIndex];
  const radarTime = radar ? new Date(radar.time * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
  return <div className="map-shell">
    <MapContainer center={[place.latitude, place.longitude]} zoom={7} minZoom={3} maxZoom={7} scrollWheelZoom className="weather-map" aria-label={`Live radar map for ${place.name}`}>
      <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {radar && <TileLayer key={radar.path} opacity={0.62} maxNativeZoom={7} maxZoom={7} url={radar.path} />}
      <Marker position={[place.latitude, place.longitude]} icon={marker}><Tooltip permanent direction="top" offset={[0, -14]} className="weather-location-label">{place.name}</Tooltip></Marker>
      <Recenter place={place} />
    </MapContainer>
    {frames.length > 0 && <div className="radar-controls" aria-label="Radar playback controls">
      <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause radar playback" : "Play radar playback"} title={playing ? "Pause radar" : "Play radar"}>{playing ? "Ⅱ" : "▶"}</button>
      <input aria-label="Radar timeline" type="range" min="0" max={frames.length - 1} value={frameIndex} onChange={(event) => { setPlaying(false); setFrameIndex(Number(event.target.value)); }} />
      <span>{radarTime}{frameIndex >= Math.max(0, frames.length - 1) ? " · now" : ""}</span>
    </div>}
    <span className="map-badge">{radar ? "Live radar" : "Map · radar unavailable"}</span>
  </div>;
}
