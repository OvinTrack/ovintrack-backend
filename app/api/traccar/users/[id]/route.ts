import { NextRequest, NextResponse } from 'next/server';

import type { FullTraccarUser } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarFetch } from '@/lib/traccar-session';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams)
{
    try
    {
        const { id } = await params;
        const user = await traccarFetch<FullTraccarUser>(`/api/users/${id}`);
        return NextResponse.json(user);
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
        const body = await request.json() as Partial<FullTraccarUser>;

        if (!body.name?.trim())
        {
            return NextResponse.json({ message: 'Le champ "name" est requis' }, { status: 400 });
        }

        if (!body.email?.trim())
        {
            return NextResponse.json({ message: 'Le champ "email" est requis' }, { status: 400 });
        }

        const payload: Partial<FullTraccarUser> = {
            id: Number(id),
            name: body.name.trim(),
            email: body.email.trim(),
            ...(body.phone !== undefined && { phone: body.phone }),
            ...(body.administrator !== undefined && { administrator: body.administrator }),
            ...(body.disabled !== undefined && { disabled: body.disabled }),
            ...(body.deviceLimit !== undefined && { deviceLimit: body.deviceLimit }),
            ...(body.userLimit !== undefined && { userLimit: body.userLimit }),
            // N'envoie le mot de passe que s'il est explicitement fourni
            ...(body.password?.trim() && { password: body.password.trim() }),
        };

        const user = await traccarFetch<FullTraccarUser>(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        return NextResponse.json(user);
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
        await traccarFetch(`/api/users/${id}`, { method: 'DELETE' });
        return new NextResponse(null, { status: 204 });
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
