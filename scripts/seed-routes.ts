#!/usr/bin/env tsx
/**
 * Одноразовый seed для data/routes.json.
 *
 * Дёргает публичный OSRM, рассчитывает geometry/distance/duration/hash для
 * маршрутов, описанных в SEED ниже. Идемпотентный по route.id: при повторном
 * запуске сохраняет created_at/created_by существующих маршрутов, остальное
 * перезаписывается. Маршруты с id, не входящими в SEED, не трогаются.
 *
 * Запуск: pnpm seed:routes
 * Сеть: требуется, OSRM endpoint https://routing.openstreetmap.de
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Point, Route } from '../src/shared/types/index.ts';
import { geometryHashFor } from './validate-data.ts';

const OSRM_BASE = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';
const DELAY_MS = 1500;
const DATA_DIR = resolve(process.cwd(), 'data');
const ACTOR = 'anakozik86-ai';

interface SeedRoute {
  id: string;
  status: 'published' | 'archived';
  name: string;
  color: string;
  description: string;
  point_ids: string[];
}

const SEED: SeedRoute[] = [
  {
    id: 'main-route',
    status: 'published',
    name: 'Основной',
    color: '#b8ff3d',
    description:
      'Главный маршрут по стрит-арту Томска. 18 работ от ТПУ-125 на юге до Легальной стены VCWALL на севере: муралы фестивалей «Выход в город», мозаики «Сибириады», граффити центральных кварталов, крупные муралы у Лагерного сада. От «Танца влюблённых рек» маршрут идёт напрямую к «Нашему космосу» через центр — восточный кластер у реки Ушайки вынесен в отдельный маршрут «Для искателей».',
    point_ids: [
      'tpu-125',
      'trud',
      'kartashova-12a-panno',
      'sibir-mesto-sily',
      'my-bukvy-s-nami-tekst',
      'raspad',
      'sluzhivyi-chelovek',
      'istoriya-kraevedcheskogo-muzeya',
      'dvorik-mlp',
      'angely',
      'lenina-76-2-graffiti-spot',
      'erdman-portrait',
      'tanec-vlyublennyh-rek',
      'nash-kosmos',
      'fedor-kuzmich',
      'u-tomi-my-neutomimy',
      'vidy-ryb',
      'vcwall',
    ],
  },
  {
    id: 'for-explorers',
    status: 'published',
    name: 'Для искателей',
    color: '#F9A825',
    description:
      'Шесть работ восточного кластера — для тех, кто прошёл основной маршрут и хочет копнуть глубже. От «Танца влюблённых рек» через «Пространство реки Ушайка» и «Болото» к «Сибирскому осетру», «Томским мотивам» и «Нашему космосу». Компактная петля между двумя точками главного маршрута.',
    point_ids: [
      'tanec-vlyublennyh-rek',
      'ushayka-space',
      'boloto-assemblage',
      'siberian-sturgeon',
      'tomskie-motivy',
      'nash-kosmos',
    ],
  },
];

// ── OSRM ──────────────────────────────────────────────────────────────────────

interface OsrmResult {
  geometry: { type: 'LineString'; coordinates: [number, number][] };
  distance_m: number;
  duration_s: number;
}

async function fetchOsrm(coords: Array<{ lat: number; lng: number }>): Promise<OsrmResult> {
  const path = coords.map((c) => `${c.lng},${c.lat}`).join(';');
  const url = `${OSRM_BASE}/${path}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OSRM HTTP ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    code?: string;
    routes?: Array<{
      geometry: { coordinates: [number, number][] };
      distance: number;
      duration: number;
    }>;
  };
  const r = data.routes?.[0];
  if (!r) throw new Error(`OSRM: routes пустой; code=${data.code ?? '?'}`);
  return {
    geometry: { type: 'LineString', coordinates: r.geometry.coordinates },
    distance_m: r.distance,
    duration_s: r.duration,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 1. Читаем points, валидируем что все point_ids существуют
  const pointsPath = resolve(DATA_DIR, 'points.json');
  if (!existsSync(pointsPath)) {
    throw new Error(`Не найден ${pointsPath}`);
  }
  const points = JSON.parse(readFileSync(pointsPath, 'utf8')) as Point[];
  const pointById = new Map(points.map((p) => [p.id, p]));
  const pointCoords = new Map(points.map((p) => [p.id, p.coords]));

  for (const seed of SEED) {
    for (const pid of seed.point_ids) {
      if (!pointById.has(pid)) {
        throw new Error(`Seed "${seed.id}": point_id "${pid}" не найден в points.json`);
      }
    }
  }

  // 2. Читаем существующие routes (для preservation created_at/created_by)
  const routesPath = resolve(DATA_DIR, 'routes.json');
  let existing: Route[] = [];
  if (existsSync(routesPath)) {
    try {
      existing = JSON.parse(readFileSync(routesPath, 'utf8')) as Route[];
    } catch (e) {
      console.warn(`Не удалось распарсить routes.json, начнём с пустого: ${(e as Error).message}`);
      existing = [];
    }
  }
  const existingById = new Map(existing.map((r) => [r.id, r]));

  // 3. Прогоняем OSRM по каждому seed
  const now = new Date().toISOString();
  const result: Route[] = [];
  let idx = 0;
  for (const seed of SEED) {
    idx++;
    console.log(
      `[${idx}/${SEED.length}] Building "${seed.name}" (${seed.point_ids.length} points)…`,
    );

    const coords = seed.point_ids.map((pid) => pointById.get(pid)!.coords);
    const { geometry, distance_m, duration_s } = await fetchOsrm(coords);
    const geometry_hash = geometryHashFor(seed.point_ids, pointCoords, undefined);

    const prev = existingById.get(seed.id);

    const route: Route = {
      id: seed.id,
      status: seed.status,
      name: seed.name,
      description: seed.description,
      point_ids: seed.point_ids,
      geometry,
      geometry_hash,
      total_distance_m: Math.round(distance_m),
      total_duration_s: Math.round(duration_s),
      color: seed.color,
      created_at: prev?.created_at ?? now,
      created_by: prev?.created_by ?? ACTOR,
      updated_at: now,
      updated_by: ACTOR,
    };

    console.log(
      `      → ${route.total_distance_m} m, ${route.total_duration_s} s, geometry: ${geometry.coordinates.length} pts`,
    );
    result.push(route);

    if (idx < SEED.length) await sleep(DELAY_MS);
  }

  // 4. Сохраняем — seed-маршруты + все остальные существующие маршруты с другими id
  const seedIds = new Set(SEED.map((s) => s.id));
  const preserved = existing.filter((r) => !seedIds.has(r.id));
  const final = [...result, ...preserved];

  writeFileSync(routesPath, JSON.stringify(final, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${routesPath} (${final.length} route${final.length === 1 ? '' : 's'})`);
  console.log('Run `pnpm validate` to verify.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
