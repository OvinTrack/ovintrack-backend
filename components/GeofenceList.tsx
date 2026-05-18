'use client';

import { useState } from 'react';
import type { TraccarGeofence } from '@/types/traccar-types';
import { GEOFENCES_CHANGED_EVENT } from '@/lib/utils';

interface GeofenceListProps
{
    geofences: TraccarGeofence[];
    isAdmin: boolean;
    selectedGeofenceId: number | null;
    onSelect: (id: number | null) => void;
}

export default function GeofenceList({ geofences, isAdmin, selectedGeofenceId, onSelect }: Readonly<GeofenceListProps>)
{
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState('');

    const handleDelete = async (geofence: TraccarGeofence) =>
    {
        if (!confirm(`Supprimer le périmètre "${geofence.name}" ? Cette action est irréversible.`)) return;

        setDeletingId(geofence.id);
        setError('');

        try
        {
            const response = await fetch(`/api/traccar/geofences/${geofence.id}`, { method: 'DELETE' });

            if (!response.ok)
            {
                const data = await response.json() as { message?: string };
                throw new Error(data.message ?? 'Erreur lors de la suppression');
            }

            globalThis.dispatchEvent(new Event(GEOFENCES_CHANGED_EVENT));
        }
        catch (err)
        {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        }
        finally
        {
            setDeletingId(null);
        }
    };

    if (geofences.length === 0) return null;

    return (
        <div className="fixed left-4 top-76 z-1000 w-56 rounded-2xl border border-gray-200 bg-white shadow-md p-3 space-y-1 max-h-[calc(100vh-20rem)] overflow-y-auto">
            <p className="text-sm font-semibold text-gray-600 pb-2 border-b border-gray-200">
                Périmètres
            </p>

            {error && (
                <p className="text-xs text-red-500 py-1">{error}</p>
            )}

            {geofences.map((geofence) => (
                <div
                    key={geofence.id}
                    className={`flex items-center justify-between gap-2 py-1 px-1 rounded-lg transition ${selectedGeofenceId === geofence.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}>
                    <button
                        onClick={() => onSelect(selectedGeofenceId === geofence.id ? null : geofence.id)}
                        className="flex-1 min-w-0 flex flex-col text-left cursor-pointer">
                        <span className="text-sm text-gray-700 truncate" title={geofence.name}>
                            {geofence.name}
                        </span>
                        {isAdmin && geofence.attributes?.userEmail && (
                            <span className="text-xs text-gray-400 truncate" title={geofence.attributes.userEmail}>
                                {geofence.attributes.userEmail}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => void handleDelete(geofence)}
                        disabled={deletingId === geofence.id}
                        aria-label={`Supprimer ${geofence.name}`}
                        title="Supprimer"
                        className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1 transition disabled:opacity-50 cursor-pointer">
                        {deletingId === geofence.id
                            ? <span className="w-4 h-4 flex items-center justify-center text-xs">…</span>
                            : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                </svg>
                            )}
                    </button>
                </div>
            ))}
        </div>
    );
}
