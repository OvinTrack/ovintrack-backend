import { NextRequest, NextResponse } from 'next/server';

import type { TraccarPosition } from '@/lib/traccar-types';
import { getTraccarErrorPayload, traccarFetch } from '@/lib/traccar-session';

export async function GET(request: NextRequest)
{
    try
    {
        const search = request.nextUrl.searchParams.toString();
        const path = search ? `/api/positions?${search}` : '/api/positions';

        const positions = await traccarFetch<TraccarPosition[]>(path);
        return NextResponse.json(positions ?? []);
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
