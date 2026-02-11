import { NextRequest, NextResponse } from 'next/server';

import { getTraccarErrorPayload, traccarFetch } from '@/lib/traccar-session';

const REPORT_TYPES = new Set(['route', 'events', 'summary', 'trips', 'stops']);

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ type: string }> },
)
{
    try
    {
        const { type } = await context.params;

        if (!REPORT_TYPES.has(type))
        {
            return NextResponse.json(
                { message: 'Invalid report type' },
                { status: 400 },
            );
        }

        const queryString = request.nextUrl.searchParams.toString();
        const path = queryString
            ? `/api/reports/${type}?${queryString}`
            : `/api/reports/${type}`;

        const report = await traccarFetch<unknown>(path);
        return NextResponse.json(report);
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
