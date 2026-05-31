import { brandLogo } from './dom.js';

const MINIMUM_VISIBLE_MS = 280;
const EXIT_ANIMATION_MS = 170;

let initialResolution = true;
let startedAt = 0;
let active = false;
let token = 0;

function protectedLocation(): boolean {
  return location.pathname.startsWith('/panel') || location.pathname.startsWith('/admin');
}

function overlay(): HTMLElement {
  let node = document.querySelector<HTMLElement>('#route-loading-overlay');
  if (node) return node;
  node = document.createElement('div');
  node.id = 'route-loading-overlay';
  node.className = 'route-loading-overlay';
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = `<div class="route-loading-card"><span class="route-loading-logo">${brandLogo('route-loading-logo__image')}</span><span class="route-loading-spinner"></span><b>در حال آماده‌سازی صفحه</b></div>`;
  document.body.append(node);
  return node;
}

export function beginRouteLoading(): void {
  if (initialResolution) return;
  if (!protectedLocation()) return;
  token += 1;
  startedAt = performance.now();
  active = true;
  const node = overlay();
  node.setAttribute('aria-hidden', 'false');
  document.documentElement.setAttribute('aria-busy', 'true');
  requestAnimationFrame(() => node.classList.add('route-loading-overlay--visible'));
}

export async function finishRouteLoading(): Promise<void> {
  if (initialResolution) {
    initialResolution = false;
    return;
  }
  if (!active) return;
  const ownToken = token;
  const remaining = Math.max(0, MINIMUM_VISIBLE_MS - (performance.now() - startedAt));
  if (remaining) await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
  if (ownToken !== token) return;
  active = false;
  const node = document.querySelector<HTMLElement>('#route-loading-overlay');
  node?.classList.remove('route-loading-overlay--visible');
  document.documentElement.removeAttribute('aria-busy');
  window.setTimeout(() => {
    if (!active) node?.setAttribute('aria-hidden', 'true');
  }, EXIT_ANIMATION_MS);
}
