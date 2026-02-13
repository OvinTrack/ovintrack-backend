import { NextResponse } from 'next/server';
import type { Ovin, TraccarDevice, TraccarPosition } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarFetch } from '@/lib/traccar-session';

export async function GET()
{
    try
    {
        const devices = await traccarFetch<TraccarDevice[]>('/api/devices') ?? [];

        const result: Ovin[] = [];

        for (const device of devices)
        {
            const positions = await traccarFetch<TraccarPosition[]>(`/api/positions?deviceId=${device.id}`) ?? [];

            if (positions.length !== 0)
            {
                const ovin: Ovin = {
                    device, position: positions[0],
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