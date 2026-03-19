'use client';

import { useEffect, useState } from 'react';
import type { Ovin } from '@/types/traccar-types';
import Map from "@/components/Map";
import { SESSION_CHANGED_EVENT } from '@/lib/utils';

export default function TraccarLoginPage()
{
  const [points, setPoints] = useState<Ovin[]>([]);

  useEffect(() =>
  {
    const syncPointsWithSession = async () =>
    {
      try
      {
        const session = await fetch('/api/session').then((r) => r.json()) as { token?: string };

        if (!session.token)
        {
          setPoints([]);
          return;
        }

        const ovinsResponse = await fetch('/api/ovins');
        if (!ovinsResponse.ok)
        {
          setPoints([]);
          return;
        }

        const ovins = await ovinsResponse.json() as Ovin[];
        setPoints(ovins);
      }
      catch
      {
        setPoints([]);
      }
    };

    void syncPointsWithSession();

    const onSessionChanged = () =>
    {
      void syncPointsWithSession();
    };

    globalThis.addEventListener(SESSION_CHANGED_EVENT, onSessionChanged);

    return () =>
    {
      globalThis.removeEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
    };
  }, []);

  return (
    <main className="overflow-hidden">
      <div className="flex w-full flex-1 items-center justify-center">
        <Map points={points} />
      </div>
    </main>
  );
}
