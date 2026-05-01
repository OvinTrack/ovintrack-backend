'use client';

import { useEffect, useRef, useState } from 'react';
import type { LatLng, Map as LeafletMap } from 'leaflet';
import { useLeafletDraw } from '@/hooks/useLeafletDraw';
import { leafletLayerToWkt } from '@/lib/geofence-wkt';
import type { ApiError } from '@/types/traccar-types';
import { GEOFENCES_CHANGED_EVENT } from '@/lib/utils';

interface GeofenceDrawPanelProps
{
    map: LeafletMap | null;
}

type Step = 'idle' | 'drawing' | 'form';

export default function GeofenceDrawPanel({ map }: GeofenceDrawPanelProps)
{
    const { startDrawing, cancelDrawing, drawnLayer, clearDrawnLayer } = useLeafletDraw(map);

    const [step, setStep] = useState<Step>('idle');
    const [drawMode, setDrawMode] = useState<'circle' | 'polygon'>('circle');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState<{ lat: number; lng: number } | null>(null);
    const [centerLocked, setCenterLocked] = useState(false);
    const [radius, setRadius] = useState<number | null>(null);

    useEffect(() =>
    {
        if (drawnLayer)
        {
            setStep('form');
        }
    }, [drawnLayer]);

    const posLocked = useRef(false);
    const centerRef = useRef<LatLng | null>(null);

    useEffect(() =>
    {
        if (!map || step !== 'drawing' || drawMode !== 'circle') return;

        posLocked.current = false;
        centerRef.current = null;

        const onMouseMove = (e: { latlng: LatLng }) =>
        {
            if (!posLocked.current)
            {
                setMousePos({ lat: e.latlng.lat, lng: e.latlng.lng });
            }
            else if (centerRef.current)
            {
                setRadius(Math.round(centerRef.current.distanceTo(e.latlng)));
            }
        };

        const onMouseDown = (e: { latlng: LatLng }) =>
        {
            posLocked.current = true;
            centerRef.current = e.latlng;
            setCenterLocked(true);
        };

        map.on('mousemove', onMouseMove);
        map.on('mousedown', onMouseDown);

        return () =>
        {
            map.off('mousemove', onMouseMove);
            map.off('mousedown', onMouseDown);
            setMousePos(null);
            setCenterLocked(false);
            setRadius(null);
        };
    }, [map, step, drawMode]);

    const handleStartDrawingMode = (mode: 'circle' | 'polygon') =>
    {
        setMessage('');
        setStep('drawing');
        startDrawing(mode);
    };

    const handleCancel = () =>
    {
        cancelDrawing();
        if (drawnLayer && map) { map.removeLayer(drawnLayer); }
        clearDrawnLayer();
        setStep('idle');
        setName('');
        setDescription('');
        setMessage('');
    };

    const handleSubmit = async () =>
    {
        if (!drawnLayer) return;

        if (!name.trim())
        {
            setMessage('Le nom est requis.');
            return;
        }

        let area: string;

        try
        {
            area = leafletLayerToWkt(drawnLayer);
        }
        catch (error)
        {
            setMessage(error instanceof Error ? error.message : 'Erreur de conversion WKT.');
            return;
        }

        setLoading(true);
        setMessage('');

        try
        {
            const response = await fetch('/api/traccar/geofences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description: description.trim(), area }),
            });

            if (!response.ok)
            {
                const error = await response.json() as ApiError;
                throw new Error(error.message ?? 'Erreur lors de la création.');
            }

            setMessage('Périmètre créé !');
            globalThis.dispatchEvent(new Event(GEOFENCES_CHANGED_EVENT));
            clearDrawnLayer();
            setStep('idle');
            setName('');
            setDescription('');
        }
        catch (error)
        {
            setMessage(error instanceof Error ? error.message : 'Erreur inattendue.');
        }
        finally
        {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-zinc-200 bg-white/90 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/90 p-4 space-y-3">

            {step === 'idle' && (
                <>
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Nouveau périmètre</p>

                    <div className="flex gap-2">
                        <button
                            className={`flex-1 rounded border px-3 py-2 text-sm cursor-pointer ${drawMode === 'circle' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                            onClick={() => { setDrawMode('circle'); handleStartDrawingMode('circle'); }}
                            disabled={!map}>
                            Cercle
                        </button>
                        <button
                            className={`flex-1 rounded border px-3 py-2 text-sm cursor-pointer ${drawMode === 'polygon' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                            onClick={() => { setDrawMode('polygon'); handleStartDrawingMode('polygon'); }}
                            disabled={!map}>
                            Polygone
                        </button>
                    </div>

                    {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
                </>
            )}

            {step === 'drawing' && (
                <>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        {drawMode === 'circle'
                            ? centerLocked
                                ? 'Définir le rayon.'
                                : 'Déplacer puis cliquer pour placer le centre du cercle.'
                            : 'Cliquez pour ajouter des points. Double-cliquez pour terminer.'}
                    </p>

                    {drawMode === 'circle' && (
                        <>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs text-zinc-400 dark:text-zinc-500">Latitude du centre</label>
                                    <input
                                        readOnly
                                        value={mousePos ? mousePos.lat.toFixed(6) : '—'}
                                        className="w-full rounded border px-2 py-1 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-zinc-400 dark:text-zinc-500">Longitude du centre</label>
                                    <input
                                        readOnly
                                        value={mousePos ? mousePos.lng.toFixed(6) : '—'}
                                        className="w-full rounded border px-2 py-1 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300" />
                                </div>
                            </div>

                            {centerLocked && (
                                <div>
                                    <label className="text-xs text-zinc-400 dark:text-zinc-500">Rayon</label>
                                    <input
                                        readOnly
                                        value={radius !== null
                                            ? radius >= 1000
                                                ? `${(radius / 1000).toFixed(2)} km`
                                                : `${radius} m`
                                            : '—'}
                                        className="w-full rounded border px-2 py-1 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300" />
                                </div>
                            )}
                        </>
                    )}

                    <button
                        className="w-full rounded border px-3 py-2 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={handleCancel}>
                        Annuler
                    </button>
                </>
            )}

            {step === 'form' && (
                <>
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Nommer le périmètre</p>

                    <input
                        className="w-full rounded border p-2 text-sm"
                        type="text"
                        placeholder="Nom *"
                        value={name}
                        onChange={(e) => setName(e.target.value)} />

                    <input
                        className="w-full rounded border p-2 text-sm"
                        type="text"
                        placeholder="Description (optionnel)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)} />

                    {message && <p className="text-sm text-red-500">{message}</p>}

                    <div className="flex gap-2">
                        <button
                            className="flex-1 rounded border px-3 py-2 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            onClick={handleCancel}
                            disabled={loading}>
                            Annuler
                        </button>
                        <button
                            className="flex-1 rounded border px-3 py-2 text-sm cursor-pointer bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-50"
                            onClick={handleSubmit}
                            disabled={loading}>
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
