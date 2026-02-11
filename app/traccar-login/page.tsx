'use client';

import { FormEvent, useState } from 'react';

import type { TraccarDevice } from '@/lib/traccar-types';

interface ApiError
{
    message?: string;
}

export default function TraccarLoginPage()
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [devices, setDevices] = useState<TraccarDevice[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();
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

            const devicesResponse = await fetch('/api/traccar/devices', {
                cache: 'no-store',
            });

            if (!devicesResponse.ok)
            {
                const errorPayload = await devicesResponse.json() as ApiError;
                throw new Error(errorPayload.message ?? 'Unable to fetch devices');
            }

            const devicesPayload = await devicesResponse.json() as TraccarDevice[];
            setDevices(devicesPayload);
            setMessage('Connected to Traccar.');
        }
        catch (error)
        {
            setDevices([]);
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

            setDevices([]);
            setMessage('Logged out.');
        }
        finally
        {
            setLoading(false);
        }
    };

    return (
        <main className="mx-auto max-w-xl p-6 space-y-4">

            <h1 className="text-xl font-semibold">Traccar Login</h1>

            <form className="space-y-3" onSubmit={onSubmit}>

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
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required />

                <div className="flex gap-2">
                    <button
                        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
                        type="submit"
                        disabled={loading}>
                        {loading ? 'Loading...' : 'Login + Load devices'}
                    </button>
                    <button
                        className="rounded border px-3 py-2 disabled:opacity-50"
                        type="button"
                        onClick={logout}
                        disabled={loading}>
                        Logout
                    </button>
                </div>
            </form>

            {message && <p className="text-sm">{message}</p>}

            <section className="space-y-2">
                <h2 className="font-medium">Devices</h2>
                <ul className="space-y-1 text-sm">
                    {devices.map((device) => (
                        <li key={device.id} className="rounded border p-2">
                            #{device.id} - {device.name} ({device.uniqueId})
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}
