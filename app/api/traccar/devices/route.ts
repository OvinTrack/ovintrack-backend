import { NextResponse } from 'next/server';

import type { TraccarDevice } from '@/lib/traccar-types';
import { getTraccarErrorPayload, traccarFetch } from '@/lib/traccar-session';

export async function GET()
{
    try
    {
        const devices = await traccarFetch<TraccarDevice[]>('/api/devices');
        return NextResponse.json(devices ?? []);
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
