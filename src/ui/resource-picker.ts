import { api, ApiError } from '../api/client.js';
import { dataOf } from '../api/data.js';
import type * as Models from '../api/generated-models.js';
import { openDialog } from '../core/dialog.js';
import { escapeHtml, icon, qs, qsa } from '../core/dom.js';
import { faDateShort, faNumber, translateEnum } from '../core/format.js';
import { badge, emptyState } from './components.js';

export interface TeaSpeakResourceSelection {
  id: number;
  label: string;
  productName?: string;
  status?: Models.ResourceListResponse['resourceStatus'];
}

export interface TeaSpeakResourcePickerOptions {
  title?: string;
  description?: string;
  selectedId?: number;
  onSelect: (selection: TeaSpeakResourceSelection) => void;
}

function resourceLabel(resource: Models.ResourceListResponse): string {
  return resource.label?.trim() || resource.productName?.trim() || `سرویس #${resource.id}`;
}

function errorMarkup(error: unknown): string {
  const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'دریافت سرویس‌ها با خطا مواجه شد.';
  return `<div class="notice notice--warning">${icon('warning')}<span>${escapeHtml(message)}</span></div>`;
}

export function openTeaSpeakResourcePicker(options: TeaSpeakResourcePickerOptions): HTMLDialogElement {
  const dialog = openDialog({
    title: options.title ?? 'انتخاب سرور TeaSpeak',
    description: options.description ?? 'فقط سرویس‌های TeaSpeak حساب شما در این فهرست نمایش داده می‌شوند.',
    content: `<div class="resource-picker">
      <label class="field"><span>جست‌وجوی سرویس</span><input type="search" data-resource-picker-search placeholder="نام سرویس، محصول یا شناسه" autocomplete="off" /></label>
      <div class="resource-picker__results" data-resource-picker-results><div class="dialog-loading"><span class="spinner"></span>در حال دریافت سرویس‌ها...</div></div>
    </div>`,
    wide: true,
    hideFooter: true,
  });

  const search = qs<HTMLInputElement>('[data-resource-picker-search]', dialog);
  const results = qs<HTMLElement>('[data-resource-picker-results]', dialog);
  let resources: Models.ResourceListResponse[] = [];

  const render = (): void => {
    const term = search.value.trim().toLowerCase();
    const filtered = resources.filter((resource) => {
      if (!term) return true;
      return [resource.id, resource.label, resource.productName]
        .filter((value) => value !== undefined && value !== null)
        .some((value) => String(value).toLowerCase().includes(term));
    });

    results.innerHTML = filtered.length
      ? `<div class="resource-picker__list">${filtered.map((resource) => {
          const id = Number(resource.id);
          const label = resourceLabel(resource);
          const selected = options.selectedId === id;
          return `<button type="button" class="resource-picker__item ${selected ? 'is-selected' : ''}" data-resource-picker-id="${id}" data-resource-picker-label="${escapeHtml(label)}" data-resource-picker-product="${escapeHtml(resource.productName ?? '')}" data-resource-picker-status="${escapeHtml(resource.resourceStatus ?? '')}">
            <span class="resource-picker__icon">${icon('dns')}</span>
            <span class="resource-picker__copy"><b>${escapeHtml(label)}</b><small>${escapeHtml(resource.productName || 'TeaSpeak')} · #${faNumber(id)} · انقضا ${faDateShort(resource.expiration)}</small></span>
            ${badge(resource.resourceStatus)}${icon(selected ? 'check_circle' : 'chevron_left')}
          </button>`;
        }).join('')}</div>`
      : emptyState('سرویس TeaSpeak پیدا نشد', term ? 'عبارت جست‌وجو را تغییر دهید.' : 'برای ساخت ساب‌دامین باید ابتدا یک سرویس TeaSpeak داشته باشید.');

    qsa<HTMLButtonElement>('[data-resource-picker-id]', results).forEach((button) => button.addEventListener('click', () => {
      const id = Number(button.dataset.resourcePickerId);
      if (!Number.isSafeInteger(id) || id < 1) return;
      options.onSelect({
        id,
        label: button.dataset.resourcePickerLabel || `سرویس #${id}`,
        productName: button.dataset.resourcePickerProduct || undefined,
        status: (button.dataset.resourcePickerStatus || undefined) as Models.ResourceListResponse['resourceStatus'],
      });
      dialog.close();
    }));
  };

  search.addEventListener('input', render);

  void (async () => {
    try {
      const response = await api.call('getResources', {});
      resources = (dataOf(response) ?? []).filter((resource) => resource.resourceType === 'TEASPEAK');
      render();
    } catch (error) {
      results.innerHTML = errorMarkup(error);
    }
  })();

  return dialog;
}
