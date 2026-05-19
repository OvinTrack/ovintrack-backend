import { traccarAdminFetch } from './traccar-session';

export async function linkDeviceToGeofence(deviceId: number, geofenceId: number): Promise<void>
{
    await traccarAdminFetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, geofenceId }),
    });
}

export async function linkUserToGeofence(userId: number, geofenceId: number): Promise<void>
{
    await traccarAdminFetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, geofenceId }),
    });
}

export async function unlinkDeviceFromGeofence(deviceId: number, geofenceId: number): Promise<void>
{
    await traccarAdminFetch('/api/permissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, geofenceId }),
    });
}
