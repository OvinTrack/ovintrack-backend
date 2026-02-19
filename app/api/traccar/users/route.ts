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

export async function POST(request : Request)
{
    try
    {
	const userData = await request.json();

        const user = await traccarFetch<TraccarUser>('/api/users/', {
	    method: 'POST',
	    headers: { 'Content-Type': 'application/json' },
	    body : JSON.stringify(userData)
	});
        return NextResponse.json(user ?? {});
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
