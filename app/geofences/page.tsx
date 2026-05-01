'use client';

import { useEffect, useRef, useState } from 'react';
import type { LayerGroup, Map as LeafletMap } from 'leaflet';
import type { Ovin, TraccarGeofence } from '@/types/traccar-types';
import GeofenceDrawPanel from '@/components/GeofenceDrawPanel';
import GeofenceList from '@/components/GeofenceList';
import { GEOFENCES_CHANGED_EVENT, SESSION_CHANGED_EVENT } from '@/lib/utils';
import { fitBoundsToGeofences, wktToLeafletLayer } from '@/lib/geofence-wkt';

export default function GeofencesPage()
{
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapInstance = useRef<LeafletMap | null>(null);
    const [map, setMap] = useState<LeafletMap | null>(null);
    const [points, setPoints] = useState<Ovin[]>([]);
    const [geofences, setGeofences] = useState<TraccarGeofence[]>([]);

    useEffect(() =>
    {
        const syncPointsWithSession = async () =>
        {
            try
            {
                const session = await fetch('/api/session').then((r) => r.json()) as { token?: string };

                if (!session.token)
                {
                    setPoints([]);
                    return;
                }

                const ovinsResponse = await fetch('/api/ovins');

                if (!ovinsResponse.ok)
                {
                    setPoints([]);
                    return;
                }

                const ovins = await ovinsResponse.json() as Ovin[];
                setPoints(ovins);

                const geofencesResponse = await fetch('/api/traccar/geofences');
                if (geofencesResponse.ok)
                {
                    const data = await geofencesResponse.json() as TraccarGeofence[];
                    setGeofences(data);
                }
            }
            catch
            {
                setPoints([]);
            }
        };

        void syncPointsWithSession();

        const onSessionChanged = () => { void syncPointsWithSession(); };
        const onGeofencesChanged = () => { void syncPointsWithSession(); };
        globalThis.addEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
        globalThis.addEventListener(GEOFENCES_CHANGED_EVENT, onGeofencesChanged);

        return () =>
        {
            globalThis.removeEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
            globalThis.removeEventListener(GEOFENCES_CHANGED_EVENT, onGeofencesChanged);
        };
    }, []);

    useEffect(() =>
    {
        if (!containerRef.current) return;

        import('leaflet').then((L) =>
        {
            import('leaflet/dist/leaflet.css');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });

            if (!containerRef.current || mapInstance.current) return;

            mapInstance.current = L.map(containerRef.current).setView([46.5, 2.5], 6);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(mapInstance.current);

            setMap(mapInstance.current);
        });

        return () =>
        {
            mapInstance.current?.remove();
            mapInstance.current = null;
            setMap(null);
        };
    }, []);

    useEffect(() =>
    {
        const m = mapInstance.current;
        if (!m) return;

        let layer: LayerGroup | null = null;

        import('leaflet').then((L) =>
        {
            layer = L.layerGroup().addTo(m);

            const safePoints = Array.isArray(points) ? points : [];

            for (const p of safePoints)
            {
                L.marker([p.position.latitude, p.position.longitude]).addTo(layer!);
            }

            if (safePoints.length > 0)
            {
                const bounds = L.latLngBounds(safePoints.map((p) => [p.position.latitude, p.position.longitude]));
                m.fitBounds(bounds, { padding: [40, 40] });
            }
        });

        return () =>
        {
            if (m && layer) { try { m.removeLayer(layer); } catch { } }
        };
    }, [points]);

    useEffect(() =>
    {
        const m = mapInstance.current;
        if (!m || geofences.length === 0) return;

        let layer: LayerGroup | null = null;

        import('leaflet').then((L) =>
        {
            layer = L.layerGroup().addTo(m);

            for (const gf of geofences)
            {
                try { wktToLeafletLayer(gf.area, L).addTo(layer!); } catch { }
            }

            fitBoundsToGeofences(geofences.map((gf) => gf.area), L, m);
        });

        return () =>
        {
            if (m && layer) { try { m.removeLayer(layer); } catch { } }
        };
    }, [geofences, map]);

    return (
        <main className="relative w-screen h-screen overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />
            <GeofenceList geofences={geofences} />
            <GeofenceDrawPanel map={map} />
        </main>
    );
}
