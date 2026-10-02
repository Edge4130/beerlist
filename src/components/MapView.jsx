import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { bandFor } from "../data/scoresheet";

export default function MapView({ pours }) {
  const el = useRef(null);
  const map = useRef(null);
  const pinned = pours.filter((p) => p.lat != null && p.lng != null);

  useEffect(() => {
    if (!el.current) return;
    map.current = L.map(el.current, { zoomControl: true }).setView([44.9778, -93.265], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap contributors",
    }).addTo(map.current);
    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const layer = L.layerGroup().addTo(m);
    // Group pours at the same spot so one pin lists everything drunk there.
    const spots = new Map();
    for (const p of pinned) {
      const k = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
      if (!spots.has(k)) spots.set(k, []);
      spots.get(k).push(p);
    }
    const pts = [];
    for (const list of spots.values()) {
      const { lat, lng } = list[0];
      pts.push([lat, lng]);
      const best = Math.max(...list.map((p) => p.total ?? 0));
      const icon = L.divIcon({ className: "pin", html: `<span>${best}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
      const div = document.createElement("div");
      const h = document.createElement("strong");
      h.textContent = list[0].place_name || "Unnamed place";
      div.appendChild(h);
      for (const p of list) {
        const row = document.createElement("div");
        row.className = "pop-row";
        row.textContent = `${p.beer_name}${p.brewery ? ", " + p.brewery : ""}: ${p.total ?? 0} (${bandFor(p.total ?? 0).label})`;
        div.appendChild(row);
      }
      L.marker([lat, lng], { icon }).bindPopup(div).addTo(layer);
    }
    if (pts.length === 1) m.setView(pts[0], 14);
    else if (pts.length > 1) m.fitBounds(pts, { padding: [40, 40] });
    return () => layer.remove();
  }, [pours]);

  return (
    <div className="mapwrap">
      <div ref={el} className="map" />
      {!pinned.length && <p className="map-empty">Beers you pin with a location show up here, grouped by where you drank them.</p>}
    </div>
  );
}
