import { TRACCAR_SESSION_COOKIE_NAME, traccarFetch } from '@/lib/traccar-session';
import type { FullTraccarUser } from '@/types/traccar-types';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET()
{
    const cookieStore = await cookies();
    const token = cookieStore.get(TRACCAR_SESSION_COOKIE_NAME)?.value;

    if (!token)
    {
        return NextResponse.json({ token: null, administrator: false });
    }

    try
    {
        const user = await traccarFetch<FullTraccarUser>('/api/session');
        return NextResponse.json({ token, administrator: user?.administrator ?? false });
    }
    catch
    {
        return NextResponse.json({ token, administrator: false });
    }
}