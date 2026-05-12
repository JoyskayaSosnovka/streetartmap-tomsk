// Задаётся через .env: VITE_GITHUB_OWNER и VITE_GITHUB_REPO
import { signal } from '@preact/signals';

export const repoOwner = signal<string>(import.meta.env.VITE_GITHUB_OWNER ?? '');
export const repoName = signal<string>(import.meta.env.VITE_GITHUB_REPO ?? '');
