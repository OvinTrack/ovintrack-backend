'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Ovin } from '@/types/traccar-types';
import Map from "@/components/Map";
import { SESSION_CHANGED_EVENT } from '@/lib/utils';

function TraccarMapContent()
{
  const [points, setPoints] = useState<Ovin[]>([]);
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get('userId');
  const selectedUserName = searchParams.get('userName')?.trim();

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

        const ovinsUrl = selectedUserId
          ? `/api/ovins?userId=${encodeURIComponent(selectedUserId)}`
          : '/api/ovins';

        const ovinsResponse = await fetch(ovinsUrl);

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
  }, [selectedUserId]);

  return (
    <main className="overflow-hidden">
      {selectedUserId && (
        <div className="px-4 pt-4 sm:px-8">
          <div className="inline-flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <span>
              Affichage des devices de l&apos;utilisateur {selectedUserName ? `"${selectedUserName}"` : `#${selectedUserId}`}.
            </span>
            <Link href="/users" className="font-medium underline hover:no-underline">
              Retour aux utilisateurs
            </Link>
            <Link href="/" className="font-medium underline hover:no-underline">
              Retirer le filtre
            </Link>
          </div>
        </div>
      )}
      <div className="flex w-full flex-1 items-center justify-center">
        <Map points={points} />
      </div>
    </main>
  );
}

export default function TraccarLoginPage()
{
  return (
    <Suspense fallback={<main className="overflow-hidden" />}>
      <TraccarMapContent />
    </Suspense>
  );
}
