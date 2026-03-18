import { NextRequest, NextResponse } from 'next/server';

import type { FullTraccarDevice } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarFetch } from '@/lib/traccar-session';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams)
{
    try
    {
        const { id } = await params;
        const device = await traccarFetch<FullTraccarDevice>(`/api/devices/${id}`);
        return NextResponse.json(device);
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
        const body = await request.json() as Partial<FullTraccarDevice>;

        if (!body.name?.trim())
        {
            return NextResponse.json({ message: 'Le champ "name" est requis' }, { status: 400 });
        }

        if (!body.uniqueId?.trim())
        {
            return NextResponse.json({ message: 'Le champ "uniqueId" est requis' }, { status: 400 });
        }

        const payload: Partial<FullTraccarDevice> = {
            id: Number(id),
            name: body.name.trim(),
            uniqueId: body.uniqueId.trim(),
            ...(body.attributes && { attributes: body.attributes }),
        };

        const device = await traccarFetch<FullTraccarDevice>(`/api/devices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        return NextResponse.json(device);
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
        await traccarFetch(`/api/devices/${id}`, { method: 'DELETE' });
        return new NextResponse(null, { status: 204 });
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
