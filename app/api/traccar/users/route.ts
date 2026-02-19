import { NextResponse } from 'next/server';

import type { TraccarUser } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarFetch } from '@/lib/traccar-session';

export async function GET()
{
    try
    {
        const users = await traccarFetch<TraccarUser[]>('/api/users');
        return NextResponse.json(users ?? []);
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
