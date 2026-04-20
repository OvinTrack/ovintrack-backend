'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import GeofenceDrawPanel from '@/components/GeofenceDrawPanel';

export default function GeofenceDrawTestPage()
{
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<LeafletMap | null>(null);

    useEffect(() =>
    {
        if (!containerRef.current) return;

        let instance: LeafletMap | null = null;

        import('leaflet').then((L) =>
        {
            import('leaflet/dist/leaflet.css');

            // Fix icônes Leaflet
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });

            if (!containerRef.current) return;

            instance = L.map(containerRef.current).setView([46.5, 2.5], 6);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(instance);

            setMap(instance);
        });

        return () =>
        {
            instance?.remove();
            setMap(null);
        };
    }, []);

    return (
        <main className="relative w-screen h-screen overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />
            <GeofenceDrawPanel map={map} />
        </main>
    );
}
