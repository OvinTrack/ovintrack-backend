"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

export type Point = {
    lat: number;
    lng: number;
    label?: string;
};

type MapProps = {
    readonly points: Point[];
};

export default function MapComponent({ points }: MapProps)
{
    const mapInstance = useRef<LeafletMap | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() =>
    {
        // Import dynamique de Leaflet côté client uniquement
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
            const layer = L.layerGroup().addTo(map);

            for (const p of points)
            {
                const marker = L.marker([p.lat, p.lng]);
                if (p.label) marker.bindPopup(p.label);
                marker.addTo(layer);
            }

            // Ajuster le zoom automatiquement
            if (points.length > 0)
            {
                const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
                map.fitBounds(bounds, { padding: [40, 40] });
            }

            // Nettoyage lors du démontage
            return () =>
            {
                map.removeLayer(layer);
            };
        });
    }, [points]);

    return (
        <div className="w-250 h-150 my-5 rounded-xl overflow-hidden shadow">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}