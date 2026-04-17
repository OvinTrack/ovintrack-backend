'use client';

import { useEffect, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Ovin } from '@/types/traccar-types';
import Map from "@/components/Map";
import GeofenceDrawPanel from '@/components/GeofenceDrawPanel';
import { SESSION_CHANGED_EVENT, TOGGLE_GEOFENCE_PANEL_EVENT } from '@/lib/utils';

export default function TraccarLoginPage()
{
  const [points, setPoints] = useState<Ovin[]>([]);
  const [leafletMap, setLeafletMap] = useState<LeafletMap | null>(null);
  const [showGeofencePanel, setShowGeofencePanel] = useState(false);

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

    const onToggleGeofencePanel = () => setShowGeofencePanel((v) => !v);

    globalThis.addEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
    globalThis.addEventListener(TOGGLE_GEOFENCE_PANEL_EVENT, onToggleGeofencePanel);

    return () =>
    {
      globalThis.removeEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
      globalThis.removeEventListener(TOGGLE_GEOFENCE_PANEL_EVENT, onToggleGeofencePanel);
    };
  }, []);

  return (
    <main className="overflow-hidden">
      <div className="flex w-full flex-1 items-center justify-center">
        <Map points={points} onMapReady={setLeafletMap} />
      </div>
      {showGeofencePanel && <GeofenceDrawPanel map={leafletMap} />}
    </main>
  );
}
