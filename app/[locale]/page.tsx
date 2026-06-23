'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Ovin } from '@/types/traccar-types';
import Map from "@/components/Map";
import { SESSION_CHANGED_EVENT } from '@/lib/utils';

function TraccarMapContent()
{
  const t = useTranslations('home');
  const [points, setPoints] = useState<Ovin[]>([]);
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get('userId');
  const selectedUserName = searchParams.get('userName')?.trim();
  const selectedDeviceIdRaw = searchParams.get('deviceId')?.trim() ?? '';
  const selectedDeviceId = Number(selectedDeviceIdRaw);
  const hasDeviceFilter = Number.isInteger(selectedDeviceId) && selectedDeviceId > 0;
  const clearDeviceFilterHref = (() =>
  {
    if (!selectedUserId)
    {
      return '/';
    }

    const params = new URLSearchParams({ userId: selectedUserId });

    if (selectedUserName)
    {
      params.set('userName', selectedUserName);
    }

    return `/?${params.toString()}`;
  })();

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
        const filteredOvins = hasDeviceFilter
          ? ovins.filter((ovin) => ovin.device.id === selectedDeviceId)
          : ovins;

        setPoints(filteredOvins);
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
  }, [hasDeviceFilter, selectedDeviceId, selectedUserId]);

  return (
    <main className="overflow-hidden">
      {selectedUserId && (
        <div className="px-4 pt-4 sm:px-8">
          <div className="inline-flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <span>
              {selectedUserName
                ? t('filterByUser', { name: selectedUserName })
                : t('filterByUserId', { id: selectedUserId })}
            </span>
            <Link href="/users" className="font-medium underline hover:no-underline">
              {t('backToUsers')}
            </Link>
            <Link href="/" className="font-medium underline hover:no-underline">
              {t('removeFilter')}
            </Link>
          </div>
        </div>
      )}
      {hasDeviceFilter && (
        <div className="px-4 pt-4 sm:px-8">
          <div className="inline-flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <span>
              {points[0]?.device.name
                ? t('viewingDeviceNamed', { id: selectedDeviceId, name: points[0].device.name })
                : t('viewingDevice', { id: selectedDeviceId })}
            </span>
            <Link href={clearDeviceFilterHref} className="font-medium underline hover:no-underline">
              {t('removeDeviceFilter')}
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
