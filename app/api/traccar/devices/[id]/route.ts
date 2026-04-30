import { NextRequest, NextResponse } from 'next/server';

import type { FullTraccarDevice, TraccarDevice } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarAdminFetch, traccarFetch } from '@/lib/traccar-session';

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
        const deviceId = Number(id);
        const body = await request.json() as Partial<FullTraccarDevice>;
        const name = body.name?.trim();
        const uniqueId = body.uniqueId?.trim();

        if (!Number.isFinite(deviceId))
        {
            return NextResponse.json({ message: 'L\'identifiant du device est invalide' }, { status: 400 });
        }

        if (!name)
        {
            return NextResponse.json({ message: 'Le champ "name" est requis' }, { status: 400 });
        }

        if (!uniqueId)
        {
            return NextResponse.json({ message: 'Le champ "uniqueId" est requis' }, { status: 400 });
        }

        const devices = await traccarAdminFetch<TraccarDevice[]>('/api/devices') ?? [];
        const duplicateDevice = devices.find(
            (device) => device.uniqueId.trim().toLowerCase() === uniqueId.toLowerCase() && device.id !== deviceId,
        );

        if (duplicateDevice)
        {
            return NextResponse.json(
                { message: 'Un appareil existe deja avec ce uniqueId.' },
                { status: 409 },
            );
        }

        const payload: Partial<FullTraccarDevice> = {
            id: deviceId,
            name,
            uniqueId,
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
