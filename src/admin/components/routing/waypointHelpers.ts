import type L from 'leaflet';
import type { RouteViaWaypoint } from '@shared/types/data.ts';

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
 * Извлекает via-waypoints с привязкой к индексу предшествующего anchor'а.
 *
 * `after` — 0-based индекс anchor'а в plain-массиве `extractAnchorIds(waypoints)`.
 * via, идущие до первого anchor'а в LRM-массиве (нормально не должны существовать,
 * LRM не создаёт такие), игнорируются.
 *
 * Координаты в формате [lat, lng] (Leaflet-native).
 */
export function extractViaWaypoints(waypoints: L.Routing.Waypoint[]): RouteViaWaypoint[] {
  const result: RouteViaWaypoint[] = [];
  let anchorIdx = -1;
  for (const wp of waypoints) {
    if (isAnchor(wp)) {
      anchorIdx++;
    } else if (anchorIdx >= 0) {
      result.push({ after: anchorIdx, lat: wp.latLng.lat, lng: wp.latLng.lng });
    }
  }
  return result;
}

/** Возвращает только якорные waypoints, отбрасывая все via. */
export function onlyAnchors(waypoints: L.Routing.Waypoint[]): L.Routing.Waypoint[] {
  return waypoints.filter(isAnchor);
}

/**
 * Нормализует via_waypoints из произвольного входа (data/routes.json, localStorage).
 *
 * Принимает:
 *   • новый формат — массив объектов `{ after, lat, lng }`.
 *   • старый формат — массив пар `[lat, lng]` (без позиции). В этом случае via
 *     отбрасываются: позиция между anchor'ами утеряна, и при восстановлении
 *     все via «сваливались бы» в первый сегмент. Лучше пустой массив — маршрут
 *     перепрокладается по anchor'ам, пользователь переделает корректировки.
 *
 * Невалидные элементы (без чисел в координатах / отрицательный `after`) тоже
 * отбрасываются.
 */
export function normalizeViaWaypoints(input: unknown): RouteViaWaypoint[] {
  if (!Array.isArray(input)) return [];
  const out: RouteViaWaypoint[] = [];
  for (const item of input) {
    if (Array.isArray(item)) continue; // старый формат [lat, lng] — отбрасываем
    if (item === null || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const { after, lat, lng } = rec;
    if (
      typeof after === 'number' &&
      Number.isInteger(after) &&
      after >= 0 &&
      typeof lat === 'number' &&
      typeof lng === 'number'
    ) {
      out.push({ after, lat, lng });
    }
  }
  return out;
}
