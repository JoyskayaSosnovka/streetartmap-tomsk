import type { Point } from '@shared/types/data.ts';

/**
 * Вычисляет geometry_hash для маршрута через Web Crypto API (browser).
 *
 * Формула ДОЛЖНА совпадать с scripts/validate-data.ts → geometryHashFor.
 * Изменение здесь требует синхронной правки там.
 *
 * Формат input строки:
 *   ANCHORS:{id1}:{lat6},{lng6}|{id2}:{lat6},{lng6}|VIA:{vlat6},{vlng6}|{vlat6},{vlng6}
 *
 * via_waypoints в формате [lat, lng] (Leaflet-native, не GeoJSON [lng, lat]).
 * Если точка из pointIds не найдена в pointsById — ставим '?' вместо координат.
 */
export async function computeGeometryHash(
  pointIds: string[],
  viaWaypoints: [number, number][],
  pointsById: Map<string, Point>,
): Promise<string> {
  const anchorsStr = pointIds
    .map((id) => {
      const p = pointsById.get(id);
      return p ? `${id}:${p.coords.lat.toFixed(6)},${p.coords.lng.toFixed(6)}` : `${id}:?`;
    })
    .join('|');

  const viaStr = viaWaypoints.map(([lat, lng]) => `${lat.toFixed(6)},${lng.toFixed(6)}`).join('|');

  const payload = `ANCHORS:${anchorsStr}|VIA:${viaStr}`;

  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
