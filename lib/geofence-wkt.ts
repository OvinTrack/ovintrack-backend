import type { Circle, Layer, Polygon } from 'leaflet';

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
    if (coords[0] !== coords[coords.length - 1])
    {
        coords.push(coords[0]);
    }

    return `POLYGON((${coords.join(', ')}))`;
}
