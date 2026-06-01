import { NextRequest, NextResponse } from 'next/server';

import type { FullTraccarUser, TraccarDevice, TraccarGeofence } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarAdminFetch, traccarFetch } from '@/lib/traccar-session';
import { linkDeviceToGeofence, linkUserToGeofence } from '@/lib/traccar-permissions';

export async function GET()
{
    try
    {
        const currentUser = await traccarFetch<FullTraccarUser>('/api/session');
        const geofences = currentUser?.administrator
            ? await traccarAdminFetch<TraccarGeofence[]>('/api/geofences?all=true')
            : await traccarFetch<TraccarGeofence[]>('/api/geofences');
        return NextResponse.json(geofences ?? []);
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}

export async function POST(request: NextRequest)
{
    try
    {
        const body = await request.json() as Partial<TraccarGeofence>;

        if (!body.name?.trim())
        {
            return NextResponse.json({ message: 'Le champ "name" est requis' }, { status: 400 });
        }

        if (!body.area?.trim())
        {
            return NextResponse.json({ message: 'Le champ "area" (WKT) est requis' }, { status: 400 });
        }

        const currentUser = await traccarFetch<FullTraccarUser>('/api/session');

        const targetUserId = body.attributes?.userId ?? (currentUser?.id != null ? String(currentUser.id) : undefined);

        const payload: Partial<TraccarGeofence> = {
            name: body.name.trim(),
            area: body.area.trim(),
            description: body.description?.trim() ?? '',
            calendarId: body.calendarId ?? 0,
            attributes: {
                ...body.attributes,
                ...(targetUserId != null && { userId: targetUserId }),
            },
        };

        const geofence = await traccarFetch<TraccarGeofence>('/api/geofences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (geofence)
        {
            const allUsers = await traccarAdminFetch<FullTraccarUser[]>('/api/users') ?? [];
            const adminIds = allUsers
                .filter((u) => u.administrator && String(u.id) !== targetUserId)
                .map((u) => u.id);

            for (const adminId of adminIds)
            {
                try
                {
                    await linkUserToGeofence(adminId, geofence.id);
                }
                catch (permissionError)
                {
                    const { status, body: permBody } = getTraccarErrorPayload(permissionError);
                    console.warn(
                        `[traccar/geofences] Admin permission assign failed for userId=${adminId}, geofenceId=${geofence.id}, status=${status}`,
                        permBody,
                    );
                }
            }
        }

        if (geofence && targetUserId)
        {
            try
            {
                await linkUserToGeofence(Number(targetUserId), geofence.id);
            }
            catch (permissionError)
            {
                const { status, body: permBody } = getTraccarErrorPayload(permissionError);
                console.warn(
                    `[traccar/geofences] User permission assign failed for userId=${targetUserId}, geofenceId=${geofence.id}, status=${status}`,
                    permBody,
                );
            }

            const devices = await traccarAdminFetch<TraccarDevice[]>(`/api/devices?userId=${targetUserId}`) ?? [];

            for (const device of devices)
            {
                try
                {
                    await linkDeviceToGeofence(device.id, geofence.id);
                }
                catch (permissionError)
                {
                    const { status, body: permBody } = getTraccarErrorPayload(permissionError);
                    console.warn(
                        `[traccar/geofences] Permission assign failed for deviceId=${device.id}, geofenceId=${geofence.id}, status=${status}`,
                        permBody,
                    );
                }
            }
        }

        return NextResponse.json(geofence, { status: 201 });
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);
        return NextResponse.json(body, { status });
    }
}
