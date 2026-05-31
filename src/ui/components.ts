import { brandLogo, escapeHtml, icon } from '../core/dom.js';
import { statusTone, translateEnum } from '../core/format.js';

export interface HeaderAction { label: string; icon?: string; href?: string; id?: string; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; }
export const pageHeader = (title: string, subtitle: string, actions: HeaderAction[] = []): string => `
  <header class="page-header">
    <div><span class="eyebrow">ابر چایی</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div>
    <div class="page-header__actions">${actions.map((action) => action.href
      ? `<a data-link href="${escapeHtml(action.href)}" class="button button--${action.variant ?? 'primary'}">${action.icon ? icon(action.icon) : ''}${escapeHtml(action.label)}</a>`
      : `<button id="${escapeHtml(action.id ?? '')}" class="button button--${action.variant ?? 'primary'}">${action.icon ? icon(action.icon) : ''}${escapeHtml(action.label)}</button>`).join('')}</div>
  </header>`;

export const statCard = (label: string, value: string, symbol: string, hint = '', tone = 'blue'): string => `
  <article class="stat-card stat-card--${escapeHtml(tone)}">
    <div class="stat-card__icon">${symbol === 'teacloud' ? brandLogo('stat-card__brand') : icon(symbol)}</div>
    <div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${hint ? `<small>${escapeHtml(hint)}</small>` : ''}</div>
  </article>`;

export const badge = (value?: string | null): string => {
  const tone = statusTone(value);
  return `<span class="badge badge--${tone}"><i></i>${escapeHtml(translateEnum(value))}</span>`;
};

export const card = (title: string, body: string, options: { icon?: string; actions?: string; className?: string } = {}): string => `
  <section class="card ${escapeHtml(options.className ?? '')}">
    <header class="card__header"><div>${options.icon ? icon(options.icon) : ''}<h2>${escapeHtml(title)}</h2></div>${options.actions ?? ''}</header>
    <div class="card__body">${body}</div>
  </section>`;

export interface TableColumn<T> { label: string; render: (row: T) => string; className?: string; }
export function dataTable<T>(columns: TableColumn<T>[], rows: T[], options: { emptyTitle?: string; emptyText?: string } = {}): string {
  if (!rows.length) return emptyState(options.emptyTitle ?? 'هنوز داده‌ای وجود ندارد', options.emptyText ?? 'پس از ایجاد اولین مورد، اطلاعات در این بخش نمایش داده می‌شود.');
  return `<div class="table-wrap"><table><thead><tr>${columns.map((column) => `<th class="${escapeHtml(column.className ?? '')}">${escapeHtml(column.label)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td class="${escapeHtml(column.className ?? '')}">${column.render(row)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

export const emptyState = (title: string, text: string, action = ''): string => `
  <div class="empty-state">${icon('inbox')}<h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>${action}</div>`;

export const loadingPage = (): string => `<div class="skeleton-page">
  <div class="skeleton skeleton--title"></div><div class="skeleton skeleton--subtitle"></div>
  <div class="stats-grid">${Array.from({ length: 4 }, () => '<div class="skeleton skeleton--stat"></div>').join('')}</div>
  <div class="skeleton skeleton--panel"></div>
</div>`;

export const field = (name: string, label: string, options: { type?: string; value?: unknown; required?: boolean; placeholder?: string; min?: number; step?: string; dir?: string; hint?: string } = {}): string => `
  <label class="field"><span>${escapeHtml(label)}${options.required ? '<b>*</b>' : ''}</span>
    <input name="${escapeHtml(name)}" type="${escapeHtml(options.type ?? 'text')}" value="${escapeHtml(options.value ?? '')}" ${options.required ? 'required' : ''} ${options.placeholder ? `placeholder="${escapeHtml(options.placeholder)}"` : ''} ${options.min !== undefined ? `min="${options.min}"` : ''} ${options.step ? `step="${escapeHtml(options.step)}"` : ''} dir="${escapeHtml(options.dir ?? 'auto')}" />
    ${options.hint ? `<small>${escapeHtml(options.hint)}</small>` : ''}
  </label>`;

export const textarea = (name: string, label: string, value = '', required = false): string => `
  <label class="field field--full"><span>${escapeHtml(label)}${required ? '<b>*</b>' : ''}</span><textarea name="${escapeHtml(name)}" ${required ? 'required' : ''}>${escapeHtml(value)}</textarea></label>`;

export const selectField = (name: string, label: string, options: Array<{ value: string | number; label: string }>, selected?: string | number, required = false): string => `
  <label class="field"><span>${escapeHtml(label)}${required ? '<b>*</b>' : ''}</span><select name="${escapeHtml(name)}" ${required ? 'required' : ''}>${options.map((option) => `<option value="${escapeHtml(option.value)}" ${String(option.value) === String(selected ?? '') ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}</select></label>`;

export const toggleField = (name: string, label: string, checked = false): string => `
  <label class="toggle"><input type="checkbox" name="${escapeHtml(name)}" ${checked ? 'checked' : ''}/><span></span><em>${escapeHtml(label)}</em></label>`;

export const pagination = (page: number, totalPages: number, prefix = ''): string => {
  if (totalPages <= 1) return '';
  const previous = Math.max(0, page - 1); const next = Math.min(totalPages - 1, page + 1);
  return `<nav class="pagination" aria-label="صفحه‌بندی"><button data-page="${previous}" ${page <= 0 ? 'disabled' : ''}>${icon('chevron_right')} قبلی</button><span>صفحه ${escapeHtml(page + 1)} از ${escapeHtml(totalPages)}</span><button data-page="${next}" ${page >= totalPages - 1 ? 'disabled' : ''}>بعدی ${icon('chevron_left')}</button></nav>`;
};

export const metricBar = (label: string, value: number, max: number): string => {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return `<div class="metric-bar"><div><span>${escapeHtml(label)}</span><b>${escapeHtml(value)} / ${escapeHtml(max)}</b></div><div class="metric-bar__track"><i style="width:${percent}%"></i></div></div>`;
};
