export const appRoot = (): HTMLElement => {
  const node = document.querySelector<HTMLElement>('#app');
  if (!node) throw new Error('ریشه برنامه پیدا نشد.');
  return node;
};

export const qs = <T extends Element>(selector: string, root: ParentNode = document): T => {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`عنصر ${selector} پیدا نشد.`);
  return node;
};

export const qsa = <T extends Element>(selector: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(selector));

export const escapeHtml = (value: unknown): string => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const icon = (name: string, className = ''): string =>
  `<span class="material-symbols-rounded ${className}" aria-hidden="true">${escapeHtml(name)}</span>`;

export const brandLogo = (className = ''): string =>
  `<img class="teacloud-logo ${escapeHtml(className)}" src="/assets/teacloud-logo.png" alt="" aria-hidden="true" />`;

export const bellIcon = (className = ''): string => `
  <svg class="svg-icon ${escapeHtml(className)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 21h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;

export const setHtml = (target: Element, html: string): void => { target.innerHTML = html; };

export const formDataObject = (form: HTMLFormElement): Record<string, string> => {
  const data = new FormData(form);
  return Object.fromEntries(Array.from(data.entries()).map(([key, value]) => [key, String(value)]));
};

export const requiredNumber = (value: FormDataEntryValue | null): number => {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error('مقدار عددی معتبر وارد کنید.');
  return number;
};

export const debounce = <Args extends unknown[]>(fn: (...args: Args) => void, wait = 250) => {
  let timer = 0;
  return (...args: Args): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
};
