'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ApiError } from '@/types/traccar-types';
import { SESSION_CHANGED_EVENT } from '@/lib/utils';

interface SessionResponse
{
    token?: string;
    administrator?: boolean;
}

const baseButtonClassName = 'inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/35 bg-white/50 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-gray-900 transition hover:bg-white/75 sm:w-auto';

export default function HeaderNav()
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const syncRoleWithSession = async () =>
    {
        try
        {
            const session = await fetch('/api/session').then((r) => r.json()) as SessionResponse;
            const loggedIn = Boolean(session.token);
            setIsLoggedIn(loggedIn);
            setIsAdmin(loggedIn && Boolean(session.administrator));

            if (loggedIn)
            {
                setMessage('');
            }
        }
        catch
        {
            setIsLoggedIn(false);
            setIsAdmin(false);
        }
    };

    useEffect(() =>
    {
        void syncRoleWithSession();

        const onSessionChanged = () =>
        {
            void syncRoleWithSession();
        };

        globalThis.addEventListener(SESSION_CHANGED_EVENT, onSessionChanged);

        return () =>
        {
            globalThis.removeEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
        };
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

            setEmail('');
            setPassword('');
            globalThis.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
            await syncRoleWithSession();
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
        }
    };

    return (
        <nav className="mt-auto w-full" aria-label="Navigation principale">
            {!isLoggedIn && (
                <form
                    className="mx-auto mt-2 flex w-full max-w-2xl flex-col gap-2 rounded-md border border-white/40 bg-white/55 p-2 backdrop-blur sm:mt-3 sm:flex-row sm:items-center sm:gap-3 sm:p-3"
                    onSubmit={(e) =>
                    {
                        e.preventDefault();
                        void onSubmit();
                    }}>
                    <input
                        className="w-full rounded border border-white/45 bg-white/90 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/70"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required />

                    <input
                        className="w-full rounded border border-white/45 bg-white/90 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/70"
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required />

                    <button
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-white/35 bg-blue-600 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        type="submit"
                        disabled={loading}>
                        {loading
                            ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Chargement...
                                </>
                            )
                            : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25m0 0a3 3 0 10-6 0V9m6-3.75H18A2.25 2.25 0 0120.25 7.5v9A2.25 2.25 0 0118 18.75H6A2.25 2.25 0 013.75 16.5v-9A2.25 2.25 0 016 5.25h3.75" />
                                    </svg>
                                    Login
                                </>
                            )}
                    </button>

                    {message && (
                        <p className="sm:ml-1 text-sm font-medium text-red-700 wrap-break-word">
                            {message}
                        </p>
                    )}
                </form>
            )}

            {isLoggedIn && (
                <ul className="grid grid-cols-2 gap-2 pb-1 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
                    <li className="w-full sm:w-auto">
                        <Link
                            href="/"
                            className={baseButtonClassName}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                            </svg>

                            Carte
                        </Link>
                    </li>
                    {isAdmin && (
                        <li className="w-full sm:w-auto">
                            <Link
                                href="/users"
                                className={baseButtonClassName}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                </svg>

                                Utilisateurs
                            </Link>
                        </li>
                    )}
                    <li className="w-full sm:w-auto">
                        <Link
                            href="/devices"
                            className={baseButtonClassName}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>

                            Appareils
                        </Link>
                    </li>
                    <li className="w-full sm:w-auto">
                        <Link
                            href="/geofences"
                            className={baseButtonClassName}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                            </svg>

                            Perimetres
                        </Link>
                    </li>
                    <li className="col-span-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={logout}
                            disabled={loading}
                            className={`${baseButtonClassName} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>

                            Deconnexion
                        </button>
                    </li>
                </ul>
            )}
        </nav>
    );
}