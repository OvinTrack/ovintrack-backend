import type { Circle, Layer, Map as LeafletMap, Polygon } from 'leaflet';

/**
 * Convertit une couche Leaflet (Circle ou Polygon) en string WKT
 * au format attendu par Traccar (ordre : latitude longitude).
 */
export function leafletLayerToWkt(layer: Layer): string
{
    if (isCircle(layer))
    {
        return circleToWkt(layer);
    }

    if (isPolygon(layer))
    {
        return polygonToWkt(layer);
    }

    throw new Error('Type de forme non supporté : seuls Circle et Polygon sont acceptés');
}

function isCircle(layer: Layer): layer is Circle
{
    return typeof (layer as Circle).getRadius === 'function'
        && typeof (layer as Circle).getLatLng === 'function';
}

function isPolygon(layer: Layer): layer is Polygon
{
    return typeof (layer as Polygon).getLatLngs === 'function'
        && typeof (layer as Circle).getRadius !== 'function';
}

function circleToWkt(circle: Circle): string
{
    const { lat, lng } = circle.getLatLng();
    const radius = Math.round(circle.getRadius());
    return `CIRCLE(${lat} ${lng}, ${radius})`;
}

function polygonToWkt(polygon: Polygon): string
{
    const latlngs = polygon.getLatLngs();

    // getLatLngs() retourne LatLng[][] pour un polygone simple
    const ring = (Array.isArray(latlngs[0]) ? latlngs[0] : latlngs) as { lat: number; lng: number }[];

    const coords = ring.map(({ lat, lng }) => `${lat} ${lng}`);

    // Fermer l'anneau si nécessaire
    if (coords[0] !== coords.at(-1))
    {
        coords.push(coords[0]);
    }

    return `POLYGON((${coords.join(', ')}))`;
}

export function wktToLeafletLayer(wkt: string, L: typeof import('leaflet')): Layer
{
    const circleMatch = new RegExp(/^CIRCLE\(\s*([\d.+-]+)\s+([\d.+-]+)\s*,\s*([\d.+-]+)\s*\)$/i).exec(wkt);

    if (circleMatch)
    {
        const lat = Number.parseFloat(circleMatch[1]);
        const lng = Number.parseFloat(circleMatch[2]);
        const radius = Number.parseFloat(circleMatch[3]);
        return L.circle([lat, lng], { radius });
    }

    const polygonMatch = new RegExp(/^POLYGON\(\((.+)\)\)$/i).exec(wkt);

    if (polygonMatch)
    {
        const points = polygonMatch[1].split(',').map((pair) =>
        {
            const [lat, lng] = pair.trim().split(/\s+/).map(Number);
            return [lat, lng] as [number, number];
        });

        return L.polygon(points);
    }

    throw new Error(`Format WKT non supporté : ${wkt}`);
}

const MIN_ZOOM = 5;

function extractPoints(wkt: string): [number, number][]
{
    const circleMatch = new RegExp(/^CIRCLE\(\s*([\d.+-]+)\s+([\d.+-]+)\s*,\s*([\d.+-]+)\s*\)$/i).exec(wkt);

    if (circleMatch) return [[Number.parseFloat(circleMatch[1]), Number.parseFloat(circleMatch[2])]];

    const polygonMatch = new RegExp(/^POLYGON\(\((.+)\)\)$/i).exec(wkt);

    if (polygonMatch)
    {
        return polygonMatch[1].split(',').map((pair) =>
        {
            const [lat, lng] = pair.trim().split(/\s+/).map(Number);
            return [lat, lng] as [number, number];
        });
    }

    return [];
}

export function fitBoundsToGeofences(wktList: string[], L: typeof import('leaflet'), map: LeafletMap): void
{
    if (wktList.length === 0) return;

    const allPoints = wktList.flatMap(extractPoints);

    if (allPoints.length === 0) return;

    const allBounds = L.latLngBounds(allPoints);

    if (map.getBoundsZoom(allBounds) >= MIN_ZOOM)
    {
        map.fitBounds(allBounds, { padding: [40, 40] });
        return;
    }

    const lastWkt = wktList.at(-1);

    if (lastWkt === undefined) return;

    const lastPoints = extractPoints(lastWkt);

    if (lastPoints.length > 0)
    {
        map.fitBounds(L.latLngBounds(lastPoints), { padding: [40, 40] });
    }
}
