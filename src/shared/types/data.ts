export interface Auditable {
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}
export type EntityStatus = 'active' | 'archived';
export type ContentStatus = 'published' | 'archived';
export interface ExternalLink {
  label: string;
  url: string;
}

export interface Category extends Auditable {
  id: string;
  name: string;
  icon: string;
  description?: string;
  order: number;
  status: EntityStatus;
}

export type CollectionType = 'festival' | 'series';
export interface Collection extends Auditable {
  id: string;
  type: CollectionType;
  name: string;
  color: string;
  description?: string;
  year_start?: number;
  year_end?: number;
  organizer_or_author?: string;
  cover_image?: string;
  external_links?: ExternalLink[];
  status: EntityStatus;
}

export interface Author extends Auditable {
  id: string;
  name: string;
  bio?: string;
  photo?: string;
  active_years?: { start?: number; end?: number };
  origin?: string;
  external_links?: ExternalLink[];
  status: EntityStatus;
}

export type PointAccessibility = 'street' | 'courtyard' | 'interior' | 'restricted' | 'unknown';
export type PointState = 'intact' | 'damaged' | 'restored' | 'painted_over' | 'removed' | 'unknown';

export interface PointPhoto {
  filename: string;
  caption?: string;
  credit?: string;
  width: number;
  height: number;
}

export interface Point extends Auditable {
  id: string;
  status: ContentStatus;
  coords: { lat: number; lng: number };
  address_hint?: string;
  accessibility: PointAccessibility;
  category_id: string;
  collection_ids: string[];
  tags: string[];
  title: string;
  description: string;
  /**
   * Список авторов работы (равноправные соавторы). Пустой массив = автор(ы) не указан(ы).
   * Порядок в массиве — порядок отображения в UI.
   */
  author_ids: string[];
  year_created?: number;
  dimensions?: string;
  materials: string[];
  state: PointState;
  state_checked_at?: string;
  photos: PointPhoto[];
  featured: boolean;
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

/**
 * Drag-промежуточная точка маршрута для коррекции линии в LRM.
 *
 * `after` — индекс anchor'а в `Route.point_ids`, ПОСЛЕ которого вставляется via
 * (0-based; диапазон `[0, point_ids.length - 2]`). То есть `after = 0` означает
 * «между 1-м и 2-м anchor'ом».
 *
 * `lat`/`lng` — Leaflet-формат (не GeoJSON [lng, lat]).
 *
 * Не участвуют в публичном рендере — RouteLayer читает только geometry. Нужны
 * только для редактора, чтобы при перезагрузке восстановить позиции via между
 * правильными сегментами маршрута.
 */
export interface RouteViaWaypoint {
  after: number;
  lat: number;
  lng: number;
}

export interface Route extends Auditable {
  id: string;
  status: ContentStatus;
  name: string;
  description?: string;
  point_ids: string[];
  via_waypoints?: RouteViaWaypoint[];
  geometry: RouteGeometry | null;
  geometry_hash: string;
  total_distance_m?: number;
  total_duration_s?: number;
  cover_image?: string;
  /** Hex-цвет линии маршрута на публичной карте. Default — '#b8ff3d' (фирменный accent). */
  color?: string;
}

export interface SiteConfig {
  schema_version: number;
  city: {
    name: string;
    name_en?: string;
    center: { lat: number; lng: number };
    default_zoom: number;
    bounds?: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } };
  };
  site: { title: string; description: string; default_locale: 'ru' };
  features: { show_lost_works_default: boolean; max_visible_collection_colors: number };
}
