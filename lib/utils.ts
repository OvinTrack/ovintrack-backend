export const SESSION_CHANGED_EVENT = 'traccar-session-changed';
export const TOGGLE_GEOFENCE_PANEL_EVENT = 'toggle-geofence-panel';
export const GEOFENCES_CHANGED_EVENT = 'geofences-changed';

export const formatDateFr = (value?: string): string =>
    {
        if (!value)
        {
            return '';
        }

        const parsed = new Date(value);

        if (Number.isNaN(parsed.getTime()))
        {
            return value;
        }

        return parsed.toLocaleDateString('fr-FR');
    };