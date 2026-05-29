'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FullTraccarUser, TraccarGeofence } from '@/types/traccar-types';
import { GEOFENCES_CHANGED_EVENT } from '@/lib/utils';

interface GeofenceListProps
{
    geofences: TraccarGeofence[];
    users: FullTraccarUser[];
    isAdmin: boolean;
    selectedGeofenceId: number | null;
    onSelect: (id: number | null) => void;
}

const DeleteButton = ({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title="Supprimer"
        className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1 transition disabled:opacity-50 cursor-pointer">
        {disabled
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
);

export default function GeofenceList({ geofences, users, isAdmin, selectedGeofenceId, onSelect }: Readonly<GeofenceListProps>)
{
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [pos, setPos] = useState({ x: 16, y: 304 });
    const dragOffset = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const portraitItemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const landscapeItemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    useEffect(() =>
    {
        if (selectedGeofenceId === null) return;
        portraitItemRefs.current.get(selectedGeofenceId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        landscapeItemRefs.current.get(selectedGeofenceId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [selectedGeofenceId]);

    const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

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

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) =>
    {
        isDragging.current = true;
        dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) =>
    {
        if (!isDragging.current) return;
        setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };

    const onPointerUp = () =>
    {
        isDragging.current = false;
    };

    if (geofences.length === 0) return null;

    return (
        <>
            {/* Portrait : barre pleine largeur dans le flux, collée au header */}
            <div className="landscape:hidden w-full h-[25vh] bg-white border-b border-gray-200 shadow-sm overflow-y-auto">
                {error && <p className="text-xs text-red-500 px-4 py-2">{error}</p>}
                {geofences.map((geofence) => (
                    <div
                        key={geofence.id}
                        ref={(el) => { if (el) portraitItemRefs.current.set(geofence.id, el); else portraitItemRefs.current.delete(geofence.id); }}
                        className={`flex items-center justify-between px-4 py-2 border-b border-gray-100 transition ${selectedGeofenceId === geofence.id ? 'bg-blue-50' : ''}`}>
                        <button
                            onClick={() => onSelect(selectedGeofenceId === geofence.id ? null : geofence.id)}
                            className="flex-1 min-w-0 flex flex-col text-left cursor-pointer">
                            <span className="text-sm text-gray-700 truncate">{geofence.name}</span>
                            {isAdmin && geofence.attributes?.userId && (
                                <span className="text-xs text-gray-400 truncate">
                                    {usersById.get(Number(geofence.attributes.userId))?.name}
                                </span>
                            )}
                        </button>
                        {selectedGeofenceId === geofence.id && (
                            <DeleteButton
                                onClick={() => void handleDelete(geofence)}
                                disabled={deletingId === geofence.id}
                                label={`Supprimer ${geofence.name}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Paysage : panneau flottant draggable */}
            <div
                className="portrait:hidden fixed z-[1000] w-56 rounded-2xl border border-gray-200 bg-white shadow-md p-3 space-y-1 max-h-[calc(100vh-20rem)] overflow-y-auto"
                style={{ left: pos.x, top: pos.y }}>
                <div
                    className="flex items-center gap-2 pb-2 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden="true">
                        <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
                        <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
                        <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
                        <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
                        <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
                        <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-600">Périmètres</p>
                </div>

                {error && <p className="text-xs text-red-500 py-1">{error}</p>}

                {geofences.map((geofence) => (
                    <div
                        key={geofence.id}
                        ref={(el) => { if (el) landscapeItemRefs.current.set(geofence.id, el); else landscapeItemRefs.current.delete(geofence.id); }}
                        className={`flex items-center justify-between gap-2 py-1 px-1 rounded-lg transition ${selectedGeofenceId === geofence.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}>
                        <button
                            onClick={() => onSelect(selectedGeofenceId === geofence.id ? null : geofence.id)}
                            className="flex-1 min-w-0 flex flex-col text-left cursor-pointer">
                            <span className="text-sm text-gray-700 truncate" title={geofence.name}>
                                {geofence.name}
                            </span>
                            {isAdmin && geofence.attributes?.userId && (
                                <span className="text-xs text-gray-400 truncate" title={usersById.get(Number(geofence.attributes.userId))?.name}>
                                    {usersById.get(Number(geofence.attributes.userId))?.name}
                                </span>
                            )}
                        </button>
                        <DeleteButton
                            onClick={() => void handleDelete(geofence)}
                            disabled={deletingId === geofence.id}
                            label={`Supprimer ${geofence.name}`} />
                    </div>
                ))}
            </div>
        </>
    );
}
