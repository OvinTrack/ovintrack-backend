import { NextResponse } from 'next/server';

import type { TraccarUser } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarFetch } from '@/lib/traccar-session';

export async function GET()
{
    try
    {
        const devices = await traccarFetch<TraccarDevice[]>('/api/users');
        return NextResponse.json(devices ?? []);
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
