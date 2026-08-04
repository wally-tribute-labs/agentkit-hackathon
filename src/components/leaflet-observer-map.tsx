"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export default function LeafletObserverMap({ latitude, longitude, label }: { latitude: number; longitude: number; label: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    let cleanup: () => void = () => undefined;
    void import("leaflet").then((leaflet) => {
      if (disposed || !container.current) return;
      const map = leaflet.map(container.current, { zoomControl: true, scrollWheelZoom: false }).setView([latitude, longitude], 13);
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      leaflet.circle([latitude, longitude], { radius: 530, color: "#f05a28", fillColor: "#f05a28", fillOpacity: .1, weight: 2 }).addTo(map);
      leaflet.circleMarker([latitude, longitude], { radius: 6, color: "#171713", fillColor: "#f05a28", fillOpacity: 1, weight: 2 }).addTo(map);
      cleanup = () => map.remove();
    });
    return () => { disposed = true; cleanup(); };
  }, [latitude, longitude]);

  return <div className="observer-map-wrap"><div ref={container} className="observer-map" role="region" aria-label={`Interactive map of ${label}`} /><p className="map-alternative">Map location: {label}. Approximate H3 resolution-eight observation area shown as a 530-metre radius.</p></div>;
}
