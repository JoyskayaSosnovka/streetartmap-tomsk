import type L from 'leaflet';

const ANCHOR_PREFIX = 'anchor:';

/**
 * Создаёт LRM Waypoint с маркировкой якоря через name = 'anchor:{pointId}'.
 * LRM сохраняет name при drag и clone — гарантия идентификации якоря.
 */
export function makeAnchorWaypoint(latLng: L.LatLng, pointId: string): L.Routing.Waypoint {
  return { latLng, name: `${ANCHOR_PREFIX}${pointId}` };
}

export function isAnchor(wp: L.Routing.Waypoint): boolean {
  return typeof wp.name === 'string' && wp.name.startsWith(ANCHOR_PREFIX);
}

export function getAnchorId(wp: L.Routing.Waypoint): string | null {
  if (!isAnchor(wp)) return null;
  return wp.name!.slice(ANCHOR_PREFIX.length);
}

/** Извлекает point_ids из плоского массива LRM waypoints (только якоря, в порядке). */
export function extractAnchorIds(waypoints: L.Routing.Waypoint[]): string[] {
  const ids: string[] = [];
  for (const wp of waypoints) {
    const id = getAnchorId(wp);
    if (id !== null) ids.push(id);
  }
  return ids;
}

/**
 * Извлекает via-координаты в формате [lat, lng] (Leaflet-native, не GeoJSON [lng, lat]).
 * via — все waypoints без anchor-маркировки.
 */
export function extractViaCoords(waypoints: L.Routing.Waypoint[]): [number, number][] {
  return waypoints
    .filter((wp) => !isAnchor(wp))
    .map((wp): [number, number] => [wp.latLng.lat, wp.latLng.lng]);
}

/** Возвращает только якорные waypoints, отбрасывая все via. */
export function onlyAnchors(waypoints: L.Routing.Waypoint[]): L.Routing.Waypoint[] {
  return waypoints.filter(isAnchor);
}
