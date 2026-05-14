import { signal, computed } from '@preact/signals';

const STORAGE_KEY = 'streetartmap_pat';
const LOGIN_KEY = 'streetartmap_login';

export const pat = signal<string>(localStorage.getItem(STORAGE_KEY) ?? '');
export const githubLogin = signal<string>(localStorage.getItem(LOGIN_KEY) ?? '');

export const isAuthenticated = computed(() => pat.value.length > 0);

export function savePat(token: string, login: string): void {
  pat.value = token;
  githubLogin.value = login;
  localStorage.setItem(STORAGE_KEY, token);
  localStorage.setItem(LOGIN_KEY, login);
}

export function logout(): void {
  pat.value = '';
  githubLogin.value = '';
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LOGIN_KEY);
}
