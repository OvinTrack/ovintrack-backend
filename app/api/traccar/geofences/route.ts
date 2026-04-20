import { NextRequest, NextResponse } from 'next/server';

import type { TraccarGeofence } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarFetch } from '@/lib/traccar-session';

export async function GET()
{
    try
    {
        const geofences = await traccarFetch<TraccarGeofence[]>('/api/geofences');
        return NextResponse.json(geofences ?? []);
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}

export async function POST(request: NextRequest)
{
    try
    {
        const body = await request.json() as Partial<TraccarGeofence>;

        if (!body.name?.trim())
        {
            return NextResponse.json({ message: 'Le champ "name" est requis' }, { status: 400 });
        }

        if (!body.area?.trim())
        {
            return NextResponse.json({ message: 'Le champ "area" (WKT) est requis' }, { status: 400 });
        }

        const payload: Partial<TraccarGeofence> = {
            name: body.name.trim(),
            area: body.area.trim(),
            description: body.description?.trim() ?? '',
            calendarId: body.calendarId ?? 0,
            attributes: body.attributes ?? {},
        };

        const geofence = await traccarFetch<TraccarGeofence>('/api/geofences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        return NextResponse.json(geofence, { status: 201 });
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
