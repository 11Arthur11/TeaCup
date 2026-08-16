import type * as Models from '../api/generated-models.js';
import { escapeHtml, icon } from '../core/dom.js';

export type WalletTransactionTypeFilter = NonNullable<Models.WalletTransactionFilterRequest['transactionType']>;
export type WalletTransactionReasonFilter = NonNullable<Models.WalletTransactionFilterRequest['transactionReason']>;

export interface WalletTransactionFilters {
  transactionType?: WalletTransactionTypeFilter;
  transactionReason?: WalletTransactionReasonFilter;
  fromCreatedAt?: string;
  toCreatedAt?: string;
}

const transactionTypes = new Set<WalletTransactionTypeFilter>(['CREDIT', 'DEBIT']);
const transactionReasons = new Set<WalletTransactionReasonFilter>(['PROLONG', 'PURCHASE', 'REFUND', 'WALLET_CHARGE']);

export function readWalletTransactionFilters(params = new URLSearchParams(location.search)): WalletTransactionFilters {
  const type = params.get('transactionType') as WalletTransactionTypeFilter | null;
  const reason = params.get('transactionReason') as WalletTransactionReasonFilter | null;
  return {
    transactionType: type && transactionTypes.has(type) ? type : undefined,
    transactionReason: reason && transactionReasons.has(reason) ? reason : undefined,
    fromCreatedAt: params.get('fromCreatedAt') || undefined,
    toCreatedAt: params.get('toCreatedAt') || undefined,
  };
}

function apiDateTime(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function dateTimeLocalValue(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function walletTransactionApiFilter(filters: WalletTransactionFilters, page: number, size = 20): Models.WalletTransactionFilterRequest {
  return {
    page,
    size,
    transactionType: filters.transactionType,
    transactionReason: filters.transactionReason,
    fromCreatedAt: apiDateTime(filters.fromCreatedAt),
    toCreatedAt: apiDateTime(filters.toCreatedAt),
  };
}

export function walletTransactionFilterToolbar(
  filters: WalletTransactionFilters,
  options: { id: string; clearHref: string; ariaLabel?: string },
): string {
  return `<form id="${escapeHtml(options.id)}" class="finance-filter-toolbar" aria-label="${escapeHtml(options.ariaLabel ?? 'فیلتر تراکنش‌های کیف پول')}">
    <label><span>نوع</span><select name="transactionType"><option value="" ${!filters.transactionType ? 'selected' : ''}>همه</option><option value="CREDIT" ${filters.transactionType === 'CREDIT' ? 'selected' : ''}>افزایش</option><option value="DEBIT" ${filters.transactionType === 'DEBIT' ? 'selected' : ''}>کاهش</option></select></label>
    <label><span>دلیل</span><select name="transactionReason"><option value="" ${!filters.transactionReason ? 'selected' : ''}>همه</option><option value="PROLONG" ${filters.transactionReason === 'PROLONG' ? 'selected' : ''}>تمدید</option><option value="PURCHASE" ${filters.transactionReason === 'PURCHASE' ? 'selected' : ''}>خرید</option><option value="REFUND" ${filters.transactionReason === 'REFUND' ? 'selected' : ''}>بازگشت وجه</option><option value="WALLET_CHARGE" ${filters.transactionReason === 'WALLET_CHARGE' ? 'selected' : ''}>شارژ</option></select></label>
    <label class="finance-filter-toolbar__date"><span>از</span><input name="fromCreatedAt" type="datetime-local" value="${escapeHtml(dateTimeLocalValue(filters.fromCreatedAt))}" /></label>
    <label class="finance-filter-toolbar__date"><span>تا</span><input name="toCreatedAt" type="datetime-local" value="${escapeHtml(dateTimeLocalValue(filters.toCreatedAt))}" /></label>
    <button type="submit" class="icon-button" aria-label="اعمال فیلتر" title="اعمال فیلتر">${icon('filter_alt')}</button>
    <a data-link class="icon-button" href="${escapeHtml(options.clearHref)}" aria-label="پاک‌کردن فیلتر" title="پاک‌کردن فیلتر">${icon('filter_alt_off')}</a>
  </form>`;
}

export function walletTransactionFilterQuery(
  form: HTMLFormElement,
  baseParams = new URLSearchParams(),
): { query: URLSearchParams; error?: string } {
  const values = new FormData(form);
  const query = new URLSearchParams(baseParams);
  const type = String(values.get('transactionType') ?? '');
  const reason = String(values.get('transactionReason') ?? '');
  const from = String(values.get('fromCreatedAt') ?? '');
  const to = String(values.get('toCreatedAt') ?? '');

  if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
    return { query, error: 'تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.' };
  }

  query.delete('page');
  query.delete('transactionType');
  query.delete('transactionReason');
  query.delete('fromCreatedAt');
  query.delete('toCreatedAt');
  if (type && transactionTypes.has(type as WalletTransactionTypeFilter)) query.set('transactionType', type);
  if (reason && transactionReasons.has(reason as WalletTransactionReasonFilter)) query.set('transactionReason', reason);
  if (from) query.set('fromCreatedAt', from);
  if (to) query.set('toCreatedAt', to);
  return { query };
}
