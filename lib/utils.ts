import { Ovin, TraccarDevice, TraccarPosition } from "@/types/traccar-types";
import { cookies } from "next/headers";

export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

export async function getOvins()
{
    const cookieStore = await cookies();
    const session = cookieStore.get('traccar_sid')?.value;

    const devicesResponse = await fetch(baseUrl + '/api/traccar/devices', {
        cache: 'no-store',
        headers: { 'Cookie': `traccar_sid=${session}`, },
    });

    let devices: TraccarDevice[] = await devicesResponse.json() as TraccarDevice[];

    devices = Array.isArray(devices) ? devices : [];

    const result: Ovin[] = [];

    for (const device of devices)
    {
        console.log(`Fetching positions for device ${device.id} (${device.name})`);

        const positionsResponse = await fetch(baseUrl + `/api/traccar/positions?deviceId=${device.id}`, {
            cache: 'no-store',
            headers: { 'Cookie': `traccar_sid=${session}`, },
        });

        const positions: TraccarPosition[] = await positionsResponse.json() as TraccarPosition[];

        console.log(`Fetched ${positions.length} positions for device ${device.id} (${device.name})`);

        if (positions.length !== 0)
        {
            const ovin: Ovin = {
                device, position: positions[0],
            };

            result.push(ovin);
        }
    }

    return result;
}