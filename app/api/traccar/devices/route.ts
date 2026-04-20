import { NextRequest, NextResponse } from 'next/server';

import type { FullTraccarDevice, FullTraccarUser, TraccarDevice, TraccarUser } from '@/types/traccar-types';
import { getTraccarErrorPayload, traccarAdminFetch, traccarFetch } from '@/lib/traccar-session';

function isGenericTraccar400Message(message: string): boolean
{
    return /^Traccar(?: admin)? request failed \(400\)$/i.test(message.trim());
}

export async function GET()
{
    try
    {
        const devices = await traccarFetch<TraccarDevice[]>('/api/devices');
        return NextResponse.json(devices ?? []);
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
        const body = await request.json() as Partial<FullTraccarDevice>;
        const name = body.name?.trim();
        const uniqueId = body.uniqueId?.trim();

        if (!name)
        {
            return NextResponse.json({ message: 'Le champ "name" est requis' }, { status: 400 });
        }

        if (!uniqueId)
        {
            return NextResponse.json({ message: 'Le champ "uniqueId" est requis' }, { status: 400 });
        }

        if (/\s/.test(uniqueId))
        {
            return NextResponse.json(
                { message: 'Le champ "uniqueId" ne doit pas contenir d\'espaces.' },
                { status: 400 },
            );
        }

        if (uniqueId.length > 128)
        {
            return NextResponse.json(
                { message: 'Le champ "uniqueId" est trop long (128 caracteres max).' },
                { status: 400 },
            );
        }

        if (name.length > 128)
        {
            return NextResponse.json(
                { message: 'Le champ "name" est trop long (128 caracteres max).' },
                { status: 400 },
            );
        }

        const devices = await traccarAdminFetch<TraccarDevice[]>('/api/devices') ?? [];
        const duplicateDevice = devices.find(
            (device) => device.uniqueId.trim().toLowerCase() === uniqueId.toLowerCase(),
        );

        if (duplicateDevice)
        {
            return NextResponse.json(
                { message: 'Un appareil existe deja avec ce uniqueId.' },
                { status: 409 },
            );
        }

        const payload: Partial<FullTraccarDevice> = {
            name,
            uniqueId,
            ...(body.attributes && { attributes: body.attributes }),
        };

        const device = await traccarAdminFetch<FullTraccarDevice>('/api/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!device?.id)
        {
            return NextResponse.json(
                { message: 'Le device a ete cree, mais aucune reponse exploitable n\'a ete retournee.' },
                { status: 502 },
            );
        }

        // Permission assignment is best-effort and should not fail device creation.
        try
        {
            const currentUser = await traccarFetch<TraccarUser>('/api/session');

            if (!currentUser?.id)
            {
                console.warn('[traccar/devices] Permission skip: no current user id available');
                return NextResponse.json(device, { status: 201 });
            }

            const users = await traccarAdminFetch<FullTraccarUser[]>('/api/users') ?? [];
            const adminIds = users
                .filter((user) => user.administrator)
                .map((user) => user.id);

            const userIds = Array.from(new Set([currentUser.id, ...adminIds]));

            for (const userId of userIds)
            {
                try
                {
                    await traccarAdminFetch('/api/permissions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId,
                            deviceId: device.id,
                        }),
                    });
                }
                catch (permissionError)
                {
                    const { status, body } = getTraccarErrorPayload(permissionError);
                    console.warn(
                        `[traccar/devices] Permission assign failed for userId=${userId}, deviceId=${device.id}, status=${status}`,
                        body,
                    );
                }
            }
        }
        catch (permissionSetupError)
        {
            const { status, body } = getTraccarErrorPayload(permissionSetupError);
            console.warn(
                `[traccar/devices] Permission setup failed for deviceId=${device.id}, status=${status}`,
                body,
            );
        }

        return NextResponse.json(device, { status: 201 });
    }
    catch (error)
    {
        const { status, body } = getTraccarErrorPayload(error);

        if (status === 400 && isGenericTraccar400Message(body.message))
        {
            return NextResponse.json(
                {
                    message: 'Traccar a rejete la creation du device. Verifiez surtout uniqueId (sans espace, <= 128 caracteres) et name (<= 128 caracteres).',
                    details: body.details,
                },
                { status },
            );
        }

        return NextResponse.json(body, { status });
    }
}
