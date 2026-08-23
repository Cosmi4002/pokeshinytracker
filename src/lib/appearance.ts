export type UiStyle = 'flat' | 'soft' | 'glass' | 'neon';
export type BackgroundStyle = 'plain' | 'mesh' | 'aurora' | 'diagonal' | 'noise' | 'pokemon' | 'diamond' | 'pixel' | 'neon';

const UI_STYLE_KEY = 'ui_style';
const BG_STYLE_KEY = 'background_style';
const BG2_KEY = 'background_color2';
const BG3_KEY = 'background_color3';

export function getStoredUiStyle(): UiStyle {
  const v = localStorage.getItem(UI_STYLE_KEY);
  if (v === 'soft' || v === 'glass' || v === 'neon' || v === 'flat') return v;
  return 'flat';
}

export function setStoredUiStyle(style: UiStyle) {
  localStorage.setItem(UI_STYLE_KEY, style);
}

export function getStoredBackgroundStyle(): BackgroundStyle {
  const v = localStorage.getItem(BG_STYLE_KEY);
  if (v === 'mesh' || v === 'aurora' || v === 'diagonal' || v === 'noise' || v === 'pokemon' || v === 'diamond' || v === 'pixel' || v === 'neon' || v === 'plain') return v;
  return 'plain';
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
  root.classList.remove('ui-flat', 'ui-soft', 'ui-glass', 'ui-neon');
  root.classList.add(`ui-${style}`);
}

export function applyBackgroundStyleToRoot(style: BackgroundStyle) {
  const root = document.documentElement;
  root.classList.remove('bg-plain', 'bg-mesh', 'bg-aurora', 'bg-diagonal', 'bg-noise', 'bg-pokemon', 'bg-diamond', 'bg-pixel', 'bg-neon');
  root.classList.add(`bg-${style}`);
}

export function applyBackgroundAccentsToRoot(color2: string, color3: string) {
  const root = document.documentElement;
  if (color2) root.style.setProperty('--bg-accent-2', color2);
  else root.style.removeProperty('--bg-accent-2');
  if (color3) root.style.setProperty('--bg-accent-3', color3);
  else root.style.removeProperty('--bg-accent-3');
}

