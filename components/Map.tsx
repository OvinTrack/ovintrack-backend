"use client";

import { useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { Ovin } from "@/types/traccar-types";

type MapProps = { readonly points: Ovin[]; };

export default function MapComponent({ points }: MapProps)
{
    const mapInstance = useRef<LeafletMap | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() =>
    {
        // Import dynamique de Leaflet côté client uniquement
        let layer: LayerGroup | null = null;

        import("leaflet").then((L) =>
        {
            import("leaflet/dist/leaflet.css");

            // Fix icônes Leaflet
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            });

            if (!containerRef.current) return;

            // Initialise la carte une seule fois
            if (!mapInstance.current)
            {
                mapInstance.current = L.map(containerRef.current).setView([46.5, 2.5], 6);

                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    maxZoom: 19,
                    attribution: "&copy; OpenStreetMap contributors",
                }).addTo(mapInstance.current);
            }

            const map = mapInstance.current;

            // Supprimer anciens marqueurs (update propre)
            layer = L.layerGroup().addTo(map);

            const safePoints = Array.isArray(points) ? points : [];

            for (const p of safePoints)
            {
                const marker = L.marker([p.position.latitude, p.position.longitude]);
                if (p.device?.name) marker.bindPopup(`ID: ${p.device.name}`);
                marker.addTo(layer);
            }

            // Ajuster le zoom automatiquement
            if (safePoints.length > 0)
            {
                const bounds = L.latLngBounds(safePoints.map((p) => [p.position.latitude, p.position.longitude]));
                map.fitBounds(bounds, { padding: [40, 40] });
            }

        });

        // Nettoyage lors du démontage
        return () =>
        {
            const map = mapInstance.current;
            if (map && layer)
            {
                try { map.removeLayer(layer); } catch { }
            }
        };
    }, [points]);

    return (
        <div className="w-screen h-screen my-5 rounded-xl shadow">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}