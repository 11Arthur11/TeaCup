import { icon } from './dom.js';

export type ThemeName = 'dark' | 'light';

const STORAGE_KEY = 'teacloud-theme';
let initialized = false;

function storedTheme(): ThemeName | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function currentTheme(): ThemeName {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function syncControls(): void {
  const isLight = currentTheme() === 'light';
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((button) => {
    button.innerHTML = icon(isLight ? 'dark_mode' : 'light_mode');
    button.setAttribute('aria-label', isLight ? 'فعال‌کردن تم تیره' : 'فعال‌کردن تم روشن');
    button.setAttribute('title', isLight ? 'تم تیره' : 'تم روشن');
    button.setAttribute('aria-pressed', String(isLight));
  });
}

export function applyTheme(theme: ThemeName, persist = true): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) themeColor.content = theme === 'light' ? '#f3f7fc' : '#071d3e';
  if (persist) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* Preferences remain usable without storage. */ }
  }
  syncControls();
  window.dispatchEvent(new CustomEvent<ThemeName>('teacloud-theme-change', { detail: theme }));
}

export function initializeTheme(): void {
  if (!document.documentElement.dataset.theme) applyTheme(storedTheme() ?? 'dark', false);
  if (initialized) {
    syncControls();
    return;
  }
  initialized = true;
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-theme-toggle]') : null;
    if (!target) return;
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });
  syncControls();
}

export function themeToggleButton(className = 'icon-button'): string {
  const isLight = currentTheme() === 'light';
  return `<button type="button" class="${className}" data-theme-toggle aria-label="${isLight ? 'فعال‌کردن تم تیره' : 'فعال‌کردن تم روشن'}" title="${isLight ? 'تم تیره' : 'تم روشن'}" aria-pressed="${isLight}">${icon(isLight ? 'dark_mode' : 'light_mode')}</button>`;
}
