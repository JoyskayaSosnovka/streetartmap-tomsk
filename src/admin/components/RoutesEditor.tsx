import type { JSX } from 'preact';
import { useEffect } from 'preact/hooks';
import { navigate } from '../state/router.ts';
import {
  routesData,
  routesLoadState,
  routesError,
  routesSaveState,
  loadRoutesAdmin,
  resetRoutes,
  archiveRoute,
} from '../state/routesState.ts';

function formatDate(iso: string): string {
  return iso
    ? new Date(iso).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    : '—';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Черновик',
    published: 'Опубликовано',
    archived: 'Архив',
  };
  return map[status] ?? status;
}

export function RoutesEditor(): JSX.Element {
  useEffect(() => {
    loadRoutesAdmin();
  }, []);

  const loadState = routesLoadState.value;
  const saveState = routesSaveState.value;
  const error = routesError.value;
  const routes = routesData.value;

  if (loadState === 'loading') {
    return (
      <div class="admin-section">
        <p class="admin-loading">Загрузка…</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div class="admin-section">
        <p class="admin-error">Ошибка: {error}</p>
        <button class="admin-btn" onClick={resetRoutes}>
          Повторить
        </button>
      </div>
    );
  }

  const active = routes.filter((r) => r.status !== 'archived');

  async function handleArchive(id: string, name: string): Promise<void> {
    if (!confirm(`Архивировать маршрут «${name}»?`)) return;
    try {
      await archiveRoute(id);
    } catch {
      // saveState signal отображает ошибку
    }
  }

  return (
    <div class="admin-section">
      <div class="admin-section__header">
        <h2 class="admin-section__title">Маршруты</h2>
        <button class="admin-btn admin-btn--primary" onClick={() => navigate('routes', 'new')}>
          + Создать
        </button>
      </div>

      {saveState === 'saving' && <p class="admin-saving">Сохранение…</p>}
      {saveState === 'error' && (
        <p class="admin-error">Ошибка сохранения. Проверь PAT и права репозитория.</p>
      )}

      {active.length === 0 ? (
        <p class="admin-empty">Маршрутов нет. Создайте первый.</p>
      ) : (
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Точки</th>
                <th>Статус</th>
                <th>Обновлён</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map((r) => (
                <tr key={r.id} class="admin-table__row">
                  <td class="admin-table__id">{r.id}</td>
                  <td class="admin-table__name">
                    <button class="admin-table__link" onClick={() => navigate('routes', r.id)}>
                      {r.name}
                    </button>
                  </td>
                  <td>{r.point_ids.length}</td>
                  <td>
                    <span class={`admin-status-badge admin-status-badge--${r.status}`}>
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td class="admin-table__date">{formatDate(r.updated_at)}</td>
                  <td class="admin-table__actions">
                    <button
                      class="admin-btn-icon"
                      title="Редактировать"
                      onClick={() => navigate('routes', r.id)}
                    >
                      ✎
                    </button>
                    <button
                      class="admin-btn-icon admin-btn-icon--danger"
                      title="Архивировать"
                      onClick={() => void handleArchive(r.id, r.name)}
                    >
                      ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
