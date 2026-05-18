/**
 * Реестр PNG-иконок категорий (стилизованный grunge street-art set).
 *
 * Для каждого имени иконки (`category.icon` из data/categories.json) хранится
 * пара URL: light (чёрные контуры для светлой темы) и dark (белые для тёмной).
 * Vite превращает импорты в правильные URL с учётом base path
 * (`/streetartmap-tomsk/...` на GitHub Pages).
 *
 * Публичное API:
 *  - resolveIcon(name): возвращает { light, dark }
 *  - renderIconSvg(set, className): возвращает HTML с двумя <img>,
 *    одна показывается в светлой теме, другая — в тёмной (через CSS).
 *
 * Имя `renderIconSvg` сохранено ради обратной совместимости с тремя
 * местами вызова (createMarker.ts, FilterPanel.tsx). Несмотря на имя,
 * функция теперь рендерит <img>, а не <svg>.
 */
import muralLight from '@public/assets/icons/categories/mural.png';
import muralDark from '@public/assets/icons/categories/mural-dark.png';
import graffitiLight from '@public/assets/icons/categories/graffiti.png';
import graffitiDark from '@public/assets/icons/categories/graffiti-dark.png';
import mosaicLight from '@public/assets/icons/categories/mosaic.png';
import mosaicDark from '@public/assets/icons/categories/mosaic-dark.png';
import otherLight from '@public/assets/icons/categories/other.png';
import otherDark from '@public/assets/icons/categories/other-dark.png';

export interface IconSet {
  readonly light: string;
  readonly dark: string;
}

const REGISTRY: Readonly<Record<string, IconSet>> = {
  paintbrush: { light: muralLight, dark: muralDark },
  'spray-can': { light: graffitiLight, dark: graffitiDark },
  'grid-3x3': { light: mosaicLight, dark: mosaicDark },
  'more-horizontal': { light: otherLight, dark: otherDark },
  // Aliases на случай, если в data/categories.json встретится другое имя иконки
  // (старые `square-dashed`, `sticker`, `box` и т.п. — все падают в `other`).
};

const FALLBACK: IconSet = REGISTRY['more-horizontal']!;

export function resolveIcon(name: string): IconSet {
  return REGISTRY[name] ?? FALLBACK;
}

/**
 * Рендерит HTML с двумя <img>: одна для светлой темы, другая для тёмной.
 * Переключение видимости — в CSS по `[data-theme='dark']` (см. markers.css
 * и FilterPanel.css).
 */
export function renderIconSvg(set: IconSet, className: string): string {
  const lightAttrs = serializeAttrs({
    class: `${className} cat-icon cat-icon--light`,
    src: set.light,
    alt: '',
    'aria-hidden': 'true',
    draggable: 'false',
  });
  const darkAttrs = serializeAttrs({
    class: `${className} cat-icon cat-icon--dark`,
    src: set.dark,
    alt: '',
    'aria-hidden': 'true',
    draggable: 'false',
  });
  return `<img ${lightAttrs}/><img ${darkAttrs}/>`;
}

function serializeAttrs(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
    .join(' ');
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
