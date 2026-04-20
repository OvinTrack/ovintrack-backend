import { useEffect, useRef, useState } from 'react';
import type { Circle, Layer, Map as LeafletMap, Polygon } from 'leaflet';

export type DrawMode = 'circle' | 'polygon';

interface UseLeafletDrawResult
{
    startDrawing: (mode: DrawMode) => void;
    cancelDrawing: () => void;
    drawnLayer: Layer | null;
    clearDrawnLayer: () => void;
}

export function useLeafletDraw(map: LeafletMap | null): UseLeafletDrawResult
{
    const [drawnLayer, setDrawnLayer] = useState<Layer | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() =>
    {
        return () =>
        {
            cleanupRef.current?.();
            cleanupRef.current = null;
        };
    }, [map]);

    const cancelDrawing = () =>
    {
        cleanupRef.current?.();
        cleanupRef.current = null;
    };

    const startDrawing = (mode: DrawMode) =>
    {
        if (!map) return;

        cancelDrawing();

        import('leaflet').then((L) =>
        {
            if (mode === 'circle')
            {
                startCircleDrawing(map, L, setDrawnLayer, cleanupRef);
            }
            else
            {
                startPolygonDrawing(map, L, setDrawnLayer, cleanupRef);
            }
        });
    };

    const clearDrawnLayer = () => setDrawnLayer(null);

    return { startDrawing, cancelDrawing, drawnLayer, clearDrawnLayer };
}

type LeafletModule = typeof import('leaflet');
type SetLayer = (layer: Layer) => void;
type CleanupRef = React.MutableRefObject<(() => void) | null>;

function startCircleDrawing(map: LeafletMap, L: LeafletModule, setDrawnLayer: SetLayer, cleanupRef: CleanupRef): void
{
    let center: { lat: number; lng: number } | null = null;
    let circle: Circle | null = null;

    const onFirstClick = (e: { latlng: { lat: number; lng: number } }) =>
    {
        center = e.latlng;
        circle = L.circle([center.lat, center.lng], { radius: 1, color: '#3b82f6' }).addTo(map);

        map.off('click', onFirstClick);
        map.on('mousemove', onMouseMove);
        map.on('click', onSecondClick);
    };

    const onMouseMove = (e: { latlng: { lat: number; lng: number } }) =>
    {
        if (!center || !circle) return;
        circle.setRadius(map.distance(center, e.latlng));
    };

    const onSecondClick = () =>
    {
        map.off('mousemove', onMouseMove);
        map.off('click', onSecondClick);

        if (circle) { setDrawnLayer(circle); circle = null; }
        cleanupRef.current = null;
    };

    map.on('click', onFirstClick);

    cleanupRef.current = () =>
    {
        map.off('click', onFirstClick);
        map.off('mousemove', onMouseMove);
        map.off('click', onSecondClick);
        if (circle) { map.removeLayer(circle); circle = null; }
    };
}

function startPolygonDrawing(map: LeafletMap, L: LeafletModule, setDrawnLayer: SetLayer, cleanupRef: CleanupRef): void
{
    const points: [number, number][] = [];
    let polygon: Polygon | null = null;

    map.doubleClickZoom.disable();
    map.getContainer().style.cursor = 'pointer';

    let clickTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingLatLng: { lat: number; lng: number } | null = null;

    const onClick = (e: { latlng: { lat: number; lng: number } }) =>
    {
        pendingLatLng = e.latlng;
        clickTimer = setTimeout(() =>
        {
            if (pendingLatLng)
            {
                points.push([pendingLatLng.lat, pendingLatLng.lng]);
                if (polygon) { map.removeLayer(polygon); }
                polygon = L.polygon(points, { color: '#3b82f6' }).addTo(map);
            }
            clickTimer = null;
            pendingLatLng = null;
        }, 250);
    };

    const onDblClick = () =>
    {
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
        pendingLatLng = null;

        if (points.length < 3) return;

        map.off('click', onClick);
        map.off('dblclick', onDblClick);
        map.doubleClickZoom.enable();
        map.getContainer().style.cursor = '';

        setDrawnLayer(polygon!);
        polygon = null;
        cleanupRef.current = null;
    };

    map.on('click', onClick);
    map.on('dblclick', onDblClick);

    cleanupRef.current = () =>
    {
        map.off('click', onClick);
        map.off('dblclick', onDblClick);
        map.doubleClickZoom.enable();
        map.getContainer().style.cursor = '';
        if (polygon) { map.removeLayer(polygon); polygon = null; }
    };
}
