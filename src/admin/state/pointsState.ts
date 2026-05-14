import { signal } from '@preact/signals';
import type { Point } from '@shared/types/data.ts';
import { getFile, putFile } from '../github/contents.ts';
import { githubLogin } from './auth.ts';
import { repoOwner, repoName } from './repoMeta.ts';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export const pointsData = signal<Point[]>([]);
export const pointsLoadState = signal<LoadState>('idle');
export const pointsSaveState = signal<'idle' | 'saving' | 'error'>('idle');
export const pointsError = signal<string | null>(null);

const shaCache: Record<string, string> = {};
const FILENAME = 'points.json';

export function loadPoints(): void {
  if (pointsLoadState.value === 'loading' || pointsLoadState.value === 'ready') return;

  pointsLoadState.value = 'loading';
  pointsError.value = null;

  getFile(repoOwner.value, repoName.value, `data/${FILENAME}`)
    .then((file) => {
      shaCache[FILENAME] = file.sha;
      const decoded = atob(file.content.replace(/\s/g, ''));
      const parsed = JSON.parse(
        new TextDecoder().decode(Uint8Array.from(decoded, (c) => c.charCodeAt(0))),
      ) as Point[];
      pointsData.value = parsed;
      pointsLoadState.value = 'ready';
    })
    .catch(() => {
      pointsError.value = 'load_error';
      pointsLoadState.value = 'error';
    });
}

export function resetPoints(): void {
  pointsLoadState.value = 'idle';
  pointsError.value = null;
}

async function savePointsFile(next: Point[], commitMsg: string): Promise<void> {
  pointsSaveState.value = 'saving';
  try {
    await putFile(
      repoOwner.value,
      repoName.value,
      `data/${FILENAME}`,
      next as unknown[],
      shaCache[FILENAME] ?? '',
      commitMsg,
    );
    // Refresh sha after write
    const updated = await getFile(repoOwner.value, repoName.value, `data/${FILENAME}`);
    shaCache[FILENAME] = updated.sha;
    pointsData.value = next;
    pointsSaveState.value = 'idle';
  } catch (err) {
    pointsSaveState.value = 'error';
    throw err;
  }
}

export async function savePoint(point: Point): Promise<void> {
  const now = new Date().toISOString();
  const login = githubLogin.value;

  const existing = pointsData.value.find((p) => p.id === point.id);
  const next: Point = existing
    ? { ...point, updated_at: now, updated_by: login }
    : { ...point, created_at: now, created_by: login, updated_at: now, updated_by: login };

  const list = existing
    ? pointsData.value.map((p) => (p.id === point.id ? next : p))
    : [...pointsData.value, next];

  const action = existing ? 'update' : 'add';
  await savePointsFile(list, `${action} point: ${point.id}`);
}

export async function archivePoint(id: string): Promise<void> {
  const now = new Date().toISOString();
  const login = githubLogin.value;

  const list = pointsData.value.map((p) =>
    p.id === id ? { ...p, status: 'archived' as const, updated_at: now, updated_by: login } : p,
  );

  await savePointsFile(list, `archive point: ${id}`);
}
