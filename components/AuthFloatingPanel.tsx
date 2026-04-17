'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ApiError } from '@/types/traccar-types';
import { SESSION_CHANGED_EVENT, TOGGLE_GEOFENCE_PANEL_EVENT } from '@/lib/utils';
import { redirect } from 'next/navigation';


export default function AuthFloatingPanel()
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() =>
    {
        void (async () =>
        {
            try
            {
                const session = await fetch('/api/session').then((r) => r.json()) as { token?: string; administrator?: boolean };
                if (session.token)
                {
                    setIsLoggedIn(true);
                    setIsAdmin(session.administrator ?? false);
                    setMessage('Connecté à Traccar.');
                }
            }
            catch
            {
                // session absente ou expiree
            }
        })();
    }, []);

    const onSubmit = async () =>
    {
        setLoading(true);
        setMessage('');

        try
        {
            const loginResponse = await fetch('/api/traccar/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!loginResponse.ok)
            {
                const errorPayload = await loginResponse.json() as ApiError;
                throw new Error(errorPayload.message ?? 'Login failed');
            }

            const sessionData = await fetch('/api/session').then((r) => r.json()) as { token?: string; administrator?: boolean };
            setIsLoggedIn(true);
            setIsAdmin(sessionData.administrator ?? false);
            setMessage('Connecte a Traccar.');
            globalThis.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
        }
        catch (error)
        {
            setMessage(error instanceof Error ? error.message : 'Unexpected error');
        }
        finally
        {
            setLoading(false);
        }
    };

    const logout = async () =>
    {
        setLoading(true);

        try
        {
            await fetch('/api/traccar/logout', {
                method: 'POST',
            });

            setIsLoggedIn(false);
            setIsAdmin(false);
            setMessage('');
            setEmail('');
            setPassword('');
            globalThis.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
        }
        finally
        {
            setLoading(false);
            redirect('/'); // Redirige vers la page d'accueil après le logout
        }
    };

    return (
        <div className="fixed right-3 top-3 z-1001 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-zinc-200 bg-white/90 shadow-lg backdrop-blur sm:right-4 sm:top-4 dark:border-zinc-700 dark:bg-zinc-950/90">
            <button
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpen((o) => !o)}>
                <span className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    {isLoggedIn ? '● Connecte' : 'Session Traccar'}
                </span>
                <span className="text-zinc-400 text-xs">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div className="space-y-3 border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-700">
                    {isLoggedIn ? (
                        <div className="space-y-3">
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/"
                                    className="rounded border px-3 py-2 text-center text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                    Carte
                                </Link>
                                {isAdmin && (
                                    <Link
                                        href="/users"
                                        className="rounded border px-3 py-2 text-center text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                        Utilisateurs
                                    </Link>
                                )}
                                <Link
                                    href="/devices"
                                    className="rounded border px-3 py-2 text-center text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                    Appareils
                                </Link>
                                {pathname === '/' && (
                                    <button
                                        className="rounded border px-3 py-2 text-center text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                        onClick={() => globalThis.dispatchEvent(new Event(TOGGLE_GEOFENCE_PANEL_EVENT))}>
                                        Périmètres
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                {message && (
                                    <p className="flex-1 text-sm text-green-600 dark:text-green-400">{message}</p>
                                )}
                                <button
                                    className="rounded border px-3 py-2 disabled:opacity-50 cursor-pointer"
                                    type="button"
                                    onClick={logout}
                                    disabled={loading}>
                                    {loading ? 'Chargement...' : 'Logout'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <input
                                className="w-full rounded border p-2"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required />

                            <input
                                className="w-full rounded border p-2"
                                type="password"
                                placeholder="Mot de passe"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required />

                            <div className="flex gap-2 justify-end">
                                <div className="flex-1">
                                    {message && <p className="text-sm text-red-500">{message}</p>}
                                </div>
                                <button
                                    className="rounded border px-3 py-2 disabled:opacity-50 cursor-pointer"
                                    type="submit"
                                    onClick={onSubmit}
                                    disabled={loading}>
                                    {loading ? 'Chargement...' : 'Login'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
