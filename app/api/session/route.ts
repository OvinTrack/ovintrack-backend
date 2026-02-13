import { TRACCAR_SESSION_COOKIE_NAME } from '@/lib/traccar-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET()
{
    const cookieStore = await cookies();
    const token = cookieStore.get(TRACCAR_SESSION_COOKIE_NAME)?.value;

    return NextResponse.json({ token });
}