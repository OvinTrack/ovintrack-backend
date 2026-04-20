import { NextRequest, NextResponse } from 'next/server';

import type { TraccarGeofence } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarFetch } from '@/lib/traccar-session';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams)
{
    try
    {
        const { id } = await params;
        const geofence = await traccarFetch<TraccarGeofence>(`/api/geofences/${id}`);
        return NextResponse.json(geofence);
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams)
{
    try
    {
        const { id } = await params;
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
            id: Number(id),
            name: body.name.trim(),
            area: body.area.trim(),
            description: body.description?.trim() ?? '',
            calendarId: body.calendarId ?? 0,
            attributes: body.attributes ?? {},
        };

        const geofence = await traccarFetch<TraccarGeofence>(`/api/geofences/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        return NextResponse.json(geofence);
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams)
{
    try
    {
        const { id } = await params;
        await traccarFetch(`/api/geofences/${id}`, { method: 'DELETE' });
        return new NextResponse(null, { status: 204 });
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
