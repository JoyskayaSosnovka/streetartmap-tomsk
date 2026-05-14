import type { JSX } from 'preact';
import { useEffect } from 'preact/hooks';
import { navigate } from '../state/router.ts';
import {
  pointsData,
  pointsLoadState,
  pointsError,
  pointsSaveState,
  loadPoints,
  resetPoints,
  archivePoint,
} from '../state/pointsState.ts';
import { categoriesData } from '../state/catalog.ts';

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

function stateLabel(state: string): string {
  const map: Record<string, string> = {
    intact: 'В порядке',
    damaged: 'Повреждена',
    restored: 'Восстановлена',
    painted_over: 'Закрашена',
    removed: 'Удалена',
    unknown: 'Неизвестно',
  };
  return map[state] ?? state;
}

export function PointsEditor(): JSX.Element {
  useEffect(() => {
    loadPoints();
  }, []);

  const loadState = pointsLoadState.value;
  const saveState = pointsSaveState.value;
  const error = pointsError.value;
  const points = pointsData.value;
  const catMap = new Map(categoriesData.value.map((c) => [c.id, c.name]));

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
        <button class="admin-btn" onClick={resetPoints}>
          Повторить
        </button>
      </div>
    );
  }

  const activePoints = points.filter((p) => p.status !== 'archived');

  async function handleArchive(id: string): Promise<void> {
    if (!confirm(`Архивировать "${id}"?`)) return;
    try {
      await archivePoint(id);
    } catch {
      // saveState signal handles error display
    }
  }

  return (
    <div class="admin-section">
      <div class="admin-section__header">
        <h2 class="admin-section__title">Точки</h2>
        <button class="admin-btn admin-btn--primary" onClick={() => navigate('points', 'new')}>
          + Создать
        </button>
      </div>

      {saveState === 'saving' && <p class="admin-saving">Сохранение…</p>}
      {saveState === 'error' && (
        <p class="admin-error">Ошибка сохранения. Проверь PAT и права репозитория.</p>
      )}

      {activePoints.length === 0 ? (
        <p class="admin-empty">Точек нет. Создайте первую.</p>
      ) : (
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Состояние</th>
                <th>Статус</th>
                <th>Обновлено</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activePoints.map((point) => (
                <tr key={point.id} class="admin-table__row">
                  <td class="admin-table__id">{point.id}</td>
                  <td class="admin-table__name">
                    <button class="admin-table__link" onClick={() => navigate('points', point.id)}>
                      {point.title || <span class="admin-table__empty">Без названия</span>}
                    </button>
                  </td>
                  <td>{catMap.get(point.category_id) ?? point.category_id}</td>
                  <td>
                    <span class={`admin-state-badge admin-state-badge--${point.state}`}>
                      {stateLabel(point.state)}
                    </span>
                  </td>
                  <td>
                    <span class={`admin-status-badge admin-status-badge--${point.status}`}>
                      {statusLabel(point.status)}
                    </span>
                  </td>
                  <td class="admin-table__date">{formatDate(point.updated_at)}</td>
                  <td class="admin-table__actions">
                    <button
                      class="admin-btn-icon"
                      title="Редактировать"
                      onClick={() => navigate('points', point.id)}
                    >
                      ✎
                    </button>
                    <button
                      class="admin-btn-icon admin-btn-icon--danger"
                      title="Архивировать"
                      onClick={() => void handleArchive(point.id)}
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
