'use client';

import { useState } from 'react';
import type { ApiError } from '@/types/traccar-types';

export default function TraccarLoginPage()
{
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) =>
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

      setMessage('Connected to Traccar.');
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
    }
    finally
    {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">

      <h1 className="text-2xl font-bold w-full text-center">OVIN-TRACK</h1>

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
            className="rounded border px-3 py-2 disabled:opacity-50"
            type="submit"
            disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
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
      <button className="mt-10 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600" onClick={() => globalThis.location.href = '/dashboard'}> View map</button>
    </main>
  );
}
