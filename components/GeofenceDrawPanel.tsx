'use client';

import { useEffect, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useLeafletDraw } from '@/hooks/useLeafletDraw';
import { leafletLayerToWkt } from '@/lib/geofence-wkt';
import type { ApiError } from '@/types/traccar-types';

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

    // Quand la forme est dessinée, passer au formulaire
    useEffect(() =>
    {
        if (drawnLayer)
        {
            setStep('form');
        }
    }, [drawnLayer]);

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
                            ? 'Cliquez et faites glisser pour dessiner un cercle.'
                            : 'Cliquez pour ajouter des points. Double-cliquez pour terminer.'}
                    </p>
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
