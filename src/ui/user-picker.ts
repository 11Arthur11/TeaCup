import { api, ApiError } from '../api/client.js';
import { contentOf, dataOf } from '../api/data.js';
import type * as Models from '../api/generated-models.js';
import { openDialog } from '../core/dialog.js';
import { escapeHtml, icon, qs, qsa } from '../core/dom.js';
import { translateEnum } from '../core/format.js';
import { badge, emptyState } from './components.js';

export interface UserSelection {
  id: number;
  label: string;
  phone?: string;
  email?: string;
  role?: Models.UserListResponse['role'];
}

export interface UserPickerOptions {
  title?: string;
  description?: string;
  onSelect: (selection: UserSelection) => void;
}

function selectionLabel(user: Models.UserListResponse): string {
  return user.fullName?.trim() || user.phone || `کاربر #${user.id}`;
}

function roleLabel(role: Models.RoleListResponse): string {
  return translateEnum(role.name) || role.name || `نقش #${role.id}`;
}

function errorMarkup(error: unknown): string {
  const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'دریافت کاربران با خطا مواجه شد.';
  return `<div class="notice notice--warning">${icon('warning')}<span>${escapeHtml(message)}</span></div>`;
}

/** Reusable backend-powered user selector for all admin flows requiring a user id. */
export function openUserPicker(options: UserPickerOptions): HTMLDialogElement {
  const dialog = openDialog({
    title: options.title ?? 'انتخاب کاربر',
    description: options.description ?? 'نام، شماره موبایل یا ایمیل را جست‌وجو کنید و کاربر موردنظر را انتخاب کنید.',
    content: `<div class="owner-picker">
      <div class="owner-picker__filters">
        <label class="field"><span>جست‌وجوی لحظه‌ای</span><input data-user-picker-search type="search" placeholder="نام، موبایل یا ایمیل" autocomplete="off" /></label>
        <label class="field"><span>نقش</span><select data-user-picker-role><option value="">همه نقش‌ها</option></select></label>
        <label class="field"><span>وضعیت حساب</span><select data-user-picker-state><option value="all">همه کاربران</option><option value="enabled">کاربران فعال</option><option value="locked">کاربران قفل‌شده</option></select></label>
      </div>
      <div class="owner-picker__results" data-user-picker-results><div class="dialog-loading"><span class="spinner"></span>در حال دریافت کاربران...</div></div>
    </div>`,
    wide: true,
    hideFooter: true,
  });

  const search = qs<HTMLInputElement>('[data-user-picker-search]', dialog);
  const role = qs<HTMLSelectElement>('[data-user-picker-role]', dialog);
  const accountState = qs<HTMLSelectElement>('[data-user-picker-state]', dialog);
  const results = qs<HTMLElement>('[data-user-picker-results]', dialog);
  let generation = 0;
  let timer = 0;

  const renderUsers = (users: Models.UserListResponse[]): void => {
    results.innerHTML = users.length
      ? `<div class="owner-picker__list">${users.map((user) => {
          const id = Number(user.id);
          const label = selectionLabel(user);
          return `<button type="button" class="owner-picker__item" data-user-id="${id}" data-user-label="${escapeHtml(label)}" data-user-phone="${escapeHtml(user.phone ?? '')}" data-user-email="${escapeHtml(user.email ?? '')}" data-user-role="${escapeHtml(user.role ?? '')}">
            <span class="owner-picker__avatar">${icon('person')}</span><span><b>${escapeHtml(label)}</b><small><i dir="ltr">${escapeHtml(user.phone || '—')}</i>${user.email ? `<i class="ltr">${escapeHtml(user.email)}</i>` : ''}</small></span>${badge(user.role)}${icon('chevron_left')}
          </button>`;
        }).join('')}</div>`
      : emptyState('کاربری پیدا نشد', 'عبارت جست‌وجو یا فیلترها را تغییر دهید.');

    qsa<HTMLButtonElement>('[data-user-id]', results).forEach((button) => button.addEventListener('click', () => {
      const id = Number(button.dataset.userId);
      if (!Number.isSafeInteger(id) || id < 1) return;
      options.onSelect({
        id,
        label: button.dataset.userLabel || `کاربر #${id}`,
        phone: button.dataset.userPhone || undefined,
        email: button.dataset.userEmail || undefined,
        role: (button.dataset.userRole || undefined) as Models.UserListResponse['role'],
      });
      dialog.close();
    }));
  };

  const load = async (): Promise<void> => {
    const requestGeneration = ++generation;
    results.innerHTML = '<div class="dialog-loading"><span class="spinner"></span>در حال دریافت کاربران...</div>';
    const filter: Models.UsersFilterRequest = {
      page: 0,
      size: 20,
      search: search.value.trim() || undefined,
      byRoleId: role.value ? Number(role.value) : undefined,
    };
    if (accountState.value === 'enabled') filter.byEnabled = true;
    if (accountState.value === 'locked') filter.byLocked = true;

    try {
      const response = await api.call('getAllUsers', { query: { filter } });
      if (requestGeneration !== generation || !dialog.open) return;
      renderUsers(contentOf(response));
    } catch (error) {
      if (requestGeneration !== generation || !dialog.open) return;
      results.innerHTML = errorMarkup(error);
    }
  };

  const scheduleLoad = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void load(), 280);
  };

  search.addEventListener('input', scheduleLoad);
  role.addEventListener('change', () => void load());
  accountState.addEventListener('change', () => void load());
  dialog.addEventListener('close', () => window.clearTimeout(timer), { once: true });

  void (async () => {
    try {
      const roles = dataOf(await api.call('getRoles', {})) ?? [];
      role.insertAdjacentHTML('beforeend', roles.map((item) => `<option value="${Number(item.id)}">${escapeHtml(roleLabel(item))}</option>`).join(''));
    } catch {
      // Role filtering is optional; search and account-state filtering remain available.
    }
    await load();
  })();

  return dialog;
}
