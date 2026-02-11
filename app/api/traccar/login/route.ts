import { NextRequest, NextResponse } from 'next/server';

import { getTraccarErrorPayload, traccarLogin } from '@/lib/traccar-session';

interface LoginBody
{
    email?: string;
    password?: string;
}

export async function POST(request: NextRequest)
{
    try
    {
        const { email, password } = await request.json() as LoginBody;

        if (!email || !password)
        {
            return NextResponse.json(
                { ok: false, message: 'email and password are required' },
                { status: 400 },
            );
        }

        const user = await traccarLogin(email, password);

        return NextResponse.json({ ok: true, user });
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json({ ok: false, ...body }, { status });
    }
}
