export type UiStyle = 'dex' | 'card' | 'holo' | 'arena';
export type BackgroundStyle = 'calm' | 'route' | 'prism' | 'safari' | 'pokeball' | 'night';
export type AppearanceSettings = {
  uiStyle: UiStyle;
  backgroundStyle: BackgroundStyle;
  backgroundColor2: string;
  backgroundColor3: string;
};

const UI_STYLE_KEY = 'ui_style';
const BG_STYLE_KEY = 'background_style';
const BG2_KEY = 'background_color2';
const BG3_KEY = 'background_color3';

export function getStoredUiStyle(): UiStyle {
  const v = localStorage.getItem(UI_STYLE_KEY);
  if (v === 'dex' || v === 'card' || v === 'holo' || v === 'arena') return v;
  if (v === 'flat' || v === 'soft') return 'dex';
  if (v === 'glass') return 'holo';
  if (v === 'neon') return 'arena';
  return 'dex';
}

export function setStoredUiStyle(style: UiStyle) {
  localStorage.setItem(UI_STYLE_KEY, style);
}

export function getStoredBackgroundStyle(): BackgroundStyle {
  const v = localStorage.getItem(BG_STYLE_KEY);
  if (v === 'calm' || v === 'route' || v === 'prism' || v === 'safari' || v === 'pokeball' || v === 'night') return v;
  if (v === 'plain') return 'calm';
  if (v === 'diagonal') return 'route';
  if (v === 'mesh') return 'prism';
  if (v === 'aurora') return 'safari';
  if (v === 'noise') return 'night';
  if (v === 'pokemon') return 'pokeball';
  return 'calm';
}

export function setStoredBackgroundStyle(style: BackgroundStyle) {
  localStorage.setItem(BG_STYLE_KEY, style);
}

export function getStoredBackgroundAccent2(): string {
  return localStorage.getItem(BG2_KEY) || '';
}

export function setStoredBackgroundAccent2(color: string) {
  localStorage.setItem(BG2_KEY, color);
}

export function getStoredBackgroundAccent3(): string {
  return localStorage.getItem(BG3_KEY) || '';
}

export function setStoredBackgroundAccent3(color: string) {
  localStorage.setItem(BG3_KEY, color);
}

export function applyUiStyleToRoot(style: UiStyle) {
  const root = document.documentElement;
  root.classList.remove('ui-flat', 'ui-soft', 'ui-glass', 'ui-neon', 'ui-dex', 'ui-card', 'ui-holo', 'ui-arena');
  root.style.removeProperty('--ui-overlay-image');
}

export function applyBackgroundStyleToRoot(style: BackgroundStyle) {
  const root = document.documentElement;
  const className = `bg-${style}`;
  if (root.classList.contains(className)) return;
  root.classList.remove(
    'bg-plain',
    'bg-mesh',
    'bg-aurora',
    'bg-diagonal',
    'bg-noise',
    'bg-pokemon',
    'bg-calm',
    'bg-route',
    'bg-prism',
    'bg-safari',
    'bg-pokeball',
    'bg-night',
  );
  root.classList.add(`bg-${style}`);
}

export function applyBackgroundAccentsToRoot(color2: string, color3: string) {
  const root = document.documentElement;
  if (color2) root.style.setProperty('--bg-accent-2', color2);
  else root.style.removeProperty('--bg-accent-2');
  if (color3) root.style.setProperty('--bg-accent-3', color3);
  else root.style.removeProperty('--bg-accent-3');
}

export function applyAppearanceToRoot(settings: AppearanceSettings) {
  applyUiStyleToRoot(settings.uiStyle);
  applyBackgroundStyleToRoot(settings.backgroundStyle);
  applyBackgroundAccentsToRoot(settings.backgroundColor2, settings.backgroundColor3);
}
