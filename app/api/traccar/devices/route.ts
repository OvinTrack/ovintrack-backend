import { NextRequest, NextResponse } from 'next/server';

import type { FullTraccarDevice, FullTraccarUser, TraccarDevice, TraccarGeofence, TraccarUser } from '@/types/traccar-types';
import { linkDeviceToGeofence } from '@/lib/traccar-permissions';
import { getTraccarErrorPayload, traccarAdminFetch, traccarFetch } from '@/lib/traccar-session';

function isGenericTraccar400Message(message: string): boolean
{
    return /^Traccar(?: admin)? request failed \(400\)$/i.test(message.trim());
}

function resolveOwnerUserId(attributes: Record<string, string> | undefined, fallbackUserId: number | undefined): number | undefined
{
    const ownerAttributeValue = attributes?.eleveurId?.trim();

    if (ownerAttributeValue)
    {
        const ownerFromAttributes = Number(ownerAttributeValue);

        if (Number.isInteger(ownerFromAttributes) && ownerFromAttributes > 0)
        {
            return ownerFromAttributes;
        }
    }

    return fallbackUserId;
}

async function assignDevicePermissionsToCurrentUserAndAdmins(deviceId: number, ownerUserId: number): Promise<void>
{
    const users = await traccarAdminFetch<FullTraccarUser[]>('/api/users') ?? [];
    const adminIds = users
        .filter((user) => user.administrator)
        .map((user) => user.id);

    const userIds = Array.from(new Set([ownerUserId, ...adminIds]));

    for (const userId of userIds)
    {
        try
        {
            await traccarAdminFetch('/api/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    deviceId,
                }),
            });
        }
        catch (permissionError)
        {
            const { status, body } = getTraccarErrorPayload(permissionError);
            console.warn(
                `[traccar/devices] Permission assign failed for userId=${userId}, deviceId=${deviceId}, status=${status}`,
                body,
            );
        }
    }
}

async function assignOwnerGeofencePermissions(deviceId: number, ownerUserId: number): Promise<void>
{
    const ownerGeofences = await traccarAdminFetch<TraccarGeofence[]>(`/api/geofences?userId=${ownerUserId}`) ?? [];

    for (const geofence of ownerGeofences)
    {
        try
        {
            await linkDeviceToGeofence(deviceId, geofence.id);
        }
        catch (permissionError)
        {
            const { status, body: permBody } = getTraccarErrorPayload(permissionError);
            console.warn(
                `[traccar/devices] Geofence permission assign failed for ownerUserId=${ownerUserId}, deviceId=${deviceId}, geofenceId=${geofence.id}, status=${status}`,
                permBody,
            );
        }
    }
}

function getDeviceValidationError(name: string | undefined, uniqueId: string | undefined, birthDate: string | undefined): string | undefined
{
    if (!name)
    {
        return 'Le champ "Nom" est requis';
    }

    if (!uniqueId)
    {
        return 'Le champ "Identifiant unique" est requis';
    }

    if (/\s/.test(uniqueId))
    {
        return 'Le champ "Identifiant unique" ne doit pas contenir d\'espaces.';
    }

    if (uniqueId.length > 128)
    {
        return 'Le champ "Identifiant unique" est trop long (128 caracteres max).';
    }

    if (name.length > 128)
    {
        return 'Le champ "Nom" est trop long (128 caracteres max).';
    }

    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate))
    {
        return 'Le champ "Date de naissance" doit avoir le format AAAA-MM-JJ.';
    }

    const birthDateObj = birthDate ? new Date(birthDate) : null;

    if (birthDateObj && Number.isNaN(birthDateObj.getTime()))
    {
        return 'Le champ "Date de naissance" doit avoir le format AAAA-MM-JJ.';
    }

    if (birthDateObj && birthDateObj > new Date())
    {
        return 'Le champ "Date de naissance" ne doit pas etre dans le futur.';
    }

    return undefined;
}

export async function GET(request: NextRequest)
{
    try
    {
        const userIdParam = request.nextUrl.searchParams.get('userId');
        const hasUserFilter = userIdParam !== null;

        let devices: TraccarDevice[] = [];

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

            devices = await traccarAdminFetch<TraccarDevice[]>(`/api/devices?userId=${userId}`) ?? [];
        }
        else
        {
            devices = await traccarFetch<TraccarDevice[]>('/api/devices') ?? [];
        }

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
        const birthDate = body.attributes?.dateNaissance?.trim();
        const validationError = getDeviceValidationError(name, uniqueId, birthDate );

        if (validationError)
        {
            return NextResponse.json({ message: validationError }, { status: 400 });
        }

        if (!name || !uniqueId)
        {
            return NextResponse.json({ message: 'Requete invalide.' }, { status: 400 });
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
            const ownerUserId = resolveOwnerUserId(body.attributes, currentUser?.id);

            if (ownerUserId && currentUser?.id)
            {
                await assignDevicePermissionsToCurrentUserAndAdmins(device.id, ownerUserId);
            }
            else
            {
                console.warn('[traccar/devices] Permission skip: no current user id available');
            }

            if (ownerUserId)
            {
                await assignOwnerGeofencePermissions(device.id, ownerUserId);
            }
            else
            {
                console.warn(`[traccar/devices] Geofence link skip: no owner user id available for deviceId=${device.id}`);
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
