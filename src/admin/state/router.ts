import { signal } from '@preact/signals';

export type AdminSection =
  | 'dashboard'
  | 'categories'
  | 'collections'
  | 'authors'
  | 'points'
  | 'routes';

export interface AdminRoute {
  section: AdminSection;
  id: string | null; // null = no id, 'new' = create, string = existing id
}

function parseHash(hash: string): AdminRoute {
  // Expected formats: '', '#dashboard', '#points', '#points/some-id', '#points/new'
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return { section: 'dashboard', id: null };

  const parts = raw.split('/');
  const section = parts[0] ?? '';
  const id = parts[1] ?? null;

  const validSections: AdminSection[] = [
    'dashboard',
    'categories',
    'collections',
    'authors',
    'points',
    'routes',
  ];

  if (!validSections.includes(section as AdminSection)) {
    return { section: 'dashboard', id: null };
  }

  return { section: section as AdminSection, id };
}

function buildHash(section: AdminSection, id: string | null): string {
  return id ? `#${section}/${id}` : `#${section}`;
}

export const currentRoute = signal<AdminRoute>(parseHash(window.location.hash));

window.addEventListener('hashchange', () => {
  currentRoute.value = parseHash(window.location.hash);
});

export function navigate(section: AdminSection, id: string | null = null): void {
  const hash = buildHash(section, id);
  history.pushState(null, '', hash);
  currentRoute.value = { section, id };
}

export function navigateBack(): void {
  history.back();
}
