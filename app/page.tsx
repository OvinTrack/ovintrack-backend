'use client';

import { useState } from 'react';
import type { ApiError, Ovin } from '@/types/traccar-types';
import Map from "@/components/Map";

export default function TraccarLoginPage()
{
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<Ovin[]>([]);

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

      setMessage('Connected to Traccar.');
      const ovins = await fetch('/api/ovins').then((response) => response.json()) as Ovin[];
      setPoints(ovins);
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

      setMessage('Logged out.');
      setPoints([]);
      globalThis.location.reload();
    }
    finally
    {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-screen h-screen items-center bg-zinc-50 font-sans dark:bg-black flex flex-col p-5">
      <div className="flex items-center justify-center bg-zinc-50 font-sans dark:bg-black w-full mb-10">
        <h1 className="text-4xl font-bold w-full text-center">OVIN-TRACK</h1>
      </div>
      <div className="space-y-3 w-xl min-h-50 border border-white rounded-2xl p-5">

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

        <div className="flex gap-2 justify-end">
          <div className="flex-1">
            {message && <p className="text-sm">{message}</p>}
          </div>
          <button
            className="rounded border px-3 py-2 disabled:opacity-50 cursor-pointer"
            type="submit"
            onClick={onSubmit}
            disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
          <button
            className="rounded border px-3 py-2 disabled:opacity-50 cursor-pointer"
            type="button"
            onClick={logout}
            disabled={loading}>
            Logout
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Map points={points} />
      </div>
    </main >
  );
}
