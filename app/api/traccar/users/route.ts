import { NextRequest, NextResponse } from 'next/server';

import type { FullTraccarUser } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarFetch } from '@/lib/traccar-session';

export async function GET()
{
    try
    {
        const users = await traccarFetch<FullTraccarUser[]>('/api/users');
        return NextResponse.json(users ?? []);
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
        const body = await request.json() as Partial<FullTraccarUser>;

        if (!body.name?.trim())
        {
            return NextResponse.json({ message: 'Le champ "name" est requis' }, { status: 400 });
        }

        if (!body.email?.trim())
        {
            return NextResponse.json({ message: 'Le champ "email" est requis' }, { status: 400 });
        }

        if (!body.password?.trim())
        {
            return NextResponse.json({ message: 'Le champ "password" est requis' }, { status: 400 });
        }

        const payload: Partial<FullTraccarUser> = {
            name: body.name.trim(),
            email: body.email.trim(),
            password: body.password.trim(),
            ...(body.phone !== undefined && { phone: body.phone }),
            ...(body.administrator !== undefined && { administrator: body.administrator }),
            ...(body.disabled !== undefined && { disabled: body.disabled }),
            ...(body.deviceLimit !== undefined && { deviceLimit: body.deviceLimit }),
            ...(body.userLimit !== undefined && { userLimit: body.userLimit }),
            ...(body.attributes !== undefined && { attributes: body.attributes }),
        };

        const user = await traccarFetch<FullTraccarUser>('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        return NextResponse.json(user, { status: 201 });
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
