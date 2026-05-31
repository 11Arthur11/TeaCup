import { api } from '../api/client.js';
import { getWalletOverview } from '../api/wallet.js';
import { dataOf } from '../api/data.js';
import type { SystemNotificationUserResponse, WalletOverviewResponse } from '../api/generated-models.js';
import { openDialog } from './dialog.js';
import { escapeHtml, icon, qsa } from './dom.js';
import { faDate, money, remainingTime } from './format.js';

const REFRESH_INTERVAL_MS = 5_000;
const RETRY_INTERVAL_MS = 1_000;

interface UserChromeState {
  notifications: SystemNotificationUserResponse[];
  walletOverview: WalletOverviewResponse;
  loaded: boolean;
}

const state: UserChromeState = {
  notifications: [],
  walletOverview: { balance: { amount: 0, currency: 'IRT' }, spentLast30days: { amount: 0, currency: 'IRT' }, spentLast7days: { amount: 0, currency: 'IRT' }, spentLastDay: { amount: 0, currency: 'IRT' } },
  loaded: false,
};

function isUserPanel(): boolean {
  return location.pathname === '/panel' || location.pathname.startsWith('/panel/');
}

function shouldPause(): boolean {
  if (document.hidden) return true;
  if (document.querySelector('dialog[open]')) return true;
  const active = document.activeElement;
  return active instanceof HTMLInputElement
    || active instanceof HTMLTextAreaElement
    || active instanceof HTMLSelectElement
    || (active instanceof HTMLElement && active.isContentEditable);
}

function excerpt(value: string | undefined, limit: number): string {
  const text = (value ?? '').trim();
  return `${text.slice(0, limit)}${text.length > limit ? '…' : ''}`;
}

function notificationListHtml(items: SystemNotificationUserResponse[], compact = false): string {
  if (!items.length) {
    return `<div class="notification-empty">${icon('notifications_off')}<b>اعلان عمومی وجود ندارد</b><span>پیام‌های جدید سامانه در این بخش نمایش داده می‌شوند.</span></div>`;
  }

  const visible = compact ? items.slice(0, 4) : items;
  return `<div class="user-notification-list ${compact ? 'user-notification-list--compact' : ''}">${visible.map((item) => `
    <button type="button" class="user-notification-item" data-notification-id="${escapeHtml(item.id ?? '')}">
      <span class="user-notification-item__icon">${icon('campaign')}</span>
      <span class="user-notification-item__copy">
        <b>${escapeHtml(item.title || 'اعلان عمومی')}</b>
        <small>${escapeHtml(excerpt(item.text, compact ? 74 : 110))}</small>
      </span>
      <time>${faDate(item.createdAt)}</time>
      ${icon('chevron_left')}
    </button>`).join('')}</div>`;
}

function findNotification(id: string): SystemNotificationUserResponse | undefined {
  return state.notifications.find((item) => String(item.id ?? '') === id);
}

function openNotificationDetail(item: SystemNotificationUserResponse): void {
  openDialog({
    title: item.title || 'اعلان عمومی',
    description: faDate(item.createdAt),
    content: `<article class="notification-detail">${icon('campaign')}<p>${escapeHtml(item.text || '').replaceAll('\n', '<br/>')}</p></article>`,
    compact: true,
    hideFooter: true,
  });
}

export function openUserNotificationsDialog(): void {
  openDialog({
    title: 'اعلان‌های عمومی',
    description: `${state.notifications.length.toLocaleString('fa-IR')} اعلان در سامانه منتشر شده است.`,
    content: notificationListHtml(state.notifications),
    wide: true,
    hideFooter: true,
  });
}

function updateDom(): void {
  qsa<HTMLElement>('[data-user-notification-count]').forEach((node) => {
    node.textContent = state.notifications.length.toLocaleString('fa-IR');
    node.setAttribute('aria-label', `${state.notifications.length.toLocaleString('fa-IR')} اعلان عمومی`);
  });
  qsa<HTMLElement>('[data-user-wallet-balance], [data-wallet-overview-balance]').forEach((node) => {
    node.textContent = money(state.walletOverview.balance);
  });
  qsa<HTMLElement>('[data-wallet-overview-coverage]').forEach((node) => {
    node.textContent = state.walletOverview.autoRenewalCoverageUntil
      ? remainingTime(state.walletOverview.autoRenewalCoverageUntil)
      : 'پوشش تمدید خودکار محاسبه نشده';
  });
  qsa<HTMLElement>('[data-overview-notifications]').forEach((node) => {
    node.innerHTML = notificationListHtml(state.notifications, true);
  });
}

let delegatedEventsBound = false;
function bindDelegatedEvents(): void {
  if (delegatedEventsBound) return;
  delegatedEventsBound = true;
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const openButton = target?.closest<HTMLElement>('[data-user-notifications-open]');
    if (openButton) {
      event.preventDefault();
      openUserNotificationsDialog();
      return;
    }

    const itemButton = target?.closest<HTMLElement>('[data-notification-id]');
    if (!itemButton) return;
    const item = findNotification(itemButton.dataset.notificationId ?? '');
    if (!item) return;
    itemButton.closest<HTMLDialogElement>('dialog')?.close();
    window.setTimeout(() => openNotificationDetail(item), 40);
  });
}

class UserChromeController {
  private generation = 0;
  private timer: number | undefined;
  private active = false;
  private inFlight: Promise<void> | undefined;

  start(): void {
    bindDelegatedEvents();
    updateDom();
    if (this.active || !isUserPanel()) return;
    this.active = true;
    this.generation += 1;
    void this.run(this.generation, !state.loaded);
  }

  setWalletOverview(walletOverview: WalletOverviewResponse): void {
    state.walletOverview = walletOverview;
    state.loaded = true;
    updateDom();
  }

  stop(): void {
    this.active = false;
    this.generation += 1;
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = undefined;
    this.inFlight = undefined;
  }

  private schedule(generation: number, delay = REFRESH_INTERVAL_MS): void {
    if (!this.active || generation !== this.generation) return;
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = undefined;
      void this.run(generation, false);
    }, delay);
  }

  private async run(generation: number, immediate: boolean): Promise<void> {
    if (!this.active || generation !== this.generation || !isUserPanel()) {
      this.stop();
      return;
    }
    if (!immediate && shouldPause()) {
      this.schedule(generation, RETRY_INTERVAL_MS);
      return;
    }
    if (this.inFlight) {
      this.schedule(generation, RETRY_INTERVAL_MS);
      return;
    }

    const request = Promise.all([
      api.call('getAllGlobalNotifications_1', {}),
      getWalletOverview({ force: true }),
    ]).then(([notificationsResponse, walletOverview]) => {
      state.notifications = dataOf(notificationsResponse) ?? [];
      state.walletOverview = walletOverview;
      state.loaded = true;
      updateDom();
    }).catch(() => {
      // Header data is secondary. The global 403 handler still handles session expiry.
      updateDom();
    });

    this.inFlight = request;
    try {
      await request;
    } finally {
      if (this.inFlight === request) this.inFlight = undefined;
      if (this.active && generation === this.generation && isUserPanel()) this.schedule(generation);
    }
  }
}

export const userChrome = new UserChromeController();
export const userChromeSnapshot = (): Readonly<UserChromeState> => state;
