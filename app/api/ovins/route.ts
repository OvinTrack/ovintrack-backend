import { NextRequest, NextResponse } from 'next/server';
import type { Ovin, FullTraccarDevice, FullTraccarUser, TraccarPosition } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarAdminFetch, traccarFetch } from '@/lib/traccar-session';

export async function GET(request: NextRequest)
{
    try
    {
        const userIdParam = request.nextUrl.searchParams.get('userId');
        const hasUserFilter = userIdParam !== null;

        let devices: FullTraccarDevice[] = [];

        if (hasUserFilter)
        {
            const userId = Number(userIdParam);

            if (!Number.isInteger(userId) || userId <= 0)
            {
                return NextResponse.json({ message: 'Le parametre "userId" est invalide.' }, { status: 400 });
            }

            const currentUser = await traccarFetch<FullTraccarUser>('/api/session');

            if (!currentUser?.administrator)
            {
                return NextResponse.json(
                    { message: 'Seuls les administrateurs peuvent filtrer par utilisateur.' },
                    { status: 403 },
                );
            }

            devices = await traccarAdminFetch<FullTraccarDevice[]>(`/api/devices?userId=${userId}`) ?? [];
        }
        else
        {
            devices = await traccarFetch<FullTraccarDevice[]>('/api/devices') ?? [];
        }

        const result: Ovin[] = [];

        for (const device of devices)
        {
            const positions = await traccarFetch<TraccarPosition[]>(`/api/positions?deviceId=${device.id}`) ?? [];

            if (positions.length !== 0)
            {
                const ovin: Ovin = {
                    device,
                    position: positions[0],
                };

                result.push(ovin);
            }
        }

        return NextResponse.json(result ?? []);
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
