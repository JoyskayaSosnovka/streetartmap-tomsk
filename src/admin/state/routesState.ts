import { signal } from '@preact/signals';
import type { Route } from '@shared/types/data.ts';
import { getFile, putFile } from '../github/contents.ts';
import { githubLogin } from './auth.ts';
import { repoOwner, repoName } from './repoMeta.ts';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export const routesData = signal<Route[]>([]);
export const routesLoadState = signal<LoadState>('idle');
export const routesSaveState = signal<'idle' | 'saving' | 'error'>('idle');
export const routesError = signal<string | null>(null);

const shaCache: Record<string, string> = {};
const FILENAME = 'routes.json';

export function loadRoutesAdmin(): void {
  if (routesLoadState.value === 'loading' || routesLoadState.value === 'ready') return;

  routesLoadState.value = 'loading';
  routesError.value = null;

  getFile(repoOwner.value, repoName.value, `data/${FILENAME}`)
    .then((file) => {
      shaCache[FILENAME] = file.sha;
      const decoded = atob(file.content.replace(/\s/g, ''));
      const parsed = JSON.parse(
        new TextDecoder().decode(Uint8Array.from(decoded, (c) => c.charCodeAt(0))),
      ) as Route[];
      routesData.value = parsed;
      routesLoadState.value = 'ready';
    })
    .catch(() => {
      routesError.value = 'load_error';
      routesLoadState.value = 'error';
    });
}

export function resetRoutes(): void {
  routesLoadState.value = 'idle';
  routesError.value = null;
}

async function saveRoutesFile(next: Route[], commitMsg: string): Promise<void> {
  routesSaveState.value = 'saving';
  try {
    await putFile(
      repoOwner.value,
      repoName.value,
      `data/${FILENAME}`,
      next as unknown[],
      shaCache[FILENAME] ?? '',
      commitMsg,
    );
    // Обновляем sha после успешного PUT
    const updated = await getFile(repoOwner.value, repoName.value, `data/${FILENAME}`);
    shaCache[FILENAME] = updated.sha;
    routesData.value = next;
    routesSaveState.value = 'idle';
  } catch (err) {
    routesSaveState.value = 'error';
    throw err;
  }
}

export async function saveRoute(route: Route): Promise<void> {
  const now = new Date().toISOString();
  const login = githubLogin.value;

  const existing = routesData.value.find((r) => r.id === route.id);
  const next: Route = existing
    ? { ...route, updated_at: now, updated_by: login }
    : { ...route, created_at: now, created_by: login, updated_at: now, updated_by: login };

  const list = existing
    ? routesData.value.map((r) => (r.id === route.id ? next : r))
    : [...routesData.value, next];

  const action = existing ? 'update' : 'add';
  await saveRoutesFile(list, `${action} route: ${route.id}`);
}

export async function archiveRoute(id: string): Promise<void> {
  const now = new Date().toISOString();
  const login = githubLogin.value;

  const list = routesData.value.map((r) =>
    r.id === id ? { ...r, status: 'archived' as const, updated_at: now, updated_by: login } : r,
  );

  await saveRoutesFile(list, `archive route: ${id}`);
}
