import { escapeHtml, icon } from './dom.js';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export function notify(message: string, tone: ToastTone = 'info', duration = 4200): void {
  const root = document.querySelector<HTMLElement>('#toast-root');
  if (!root) return;
  const item = document.createElement('div');
  const symbol = tone === 'success' ? 'check_circle' : tone === 'error' ? 'error' : tone === 'warning' ? 'warning' : 'info';
  item.className = `toast toast--${tone}`;
  item.innerHTML = `${icon(symbol)}<div class="toast__message">${escapeHtml(message)}</div><button class="icon-button toast__close" aria-label="بستن">${icon('close')}</button>`;
  root.append(item);
  const close = (): void => { item.classList.add('toast--exit'); window.setTimeout(() => item.remove(), 180); };
  item.querySelector('button')?.addEventListener('click', close);
  window.setTimeout(close, duration);
}
