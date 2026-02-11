import { NextResponse } from 'next/server';

import { getTraccarErrorPayload, requireTraccarSessionCookie, traccarLogout } from '@/lib/traccar-session';

export async function POST()
{
    try
    {
        await requireTraccarSessionCookie();
        await traccarLogout();

        return NextResponse.json({ ok: true });
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json({ ok: false, ...body }, { status });
    }
}
