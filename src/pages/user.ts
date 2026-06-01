import { api, ApiError } from '../api/client.js';
import { getUserDashboardOverview } from '../api/dashboard.js';
import { getWalletOverview } from '../api/wallet.js';
import { contentOf, dataOf, pageOf } from '../api/data.js';
import type * as Models from '../api/generated-models.js';
import { runAction } from '../core/action.js';
import { confirmDialog, openDialog } from '../core/dialog.js';
import { brandLogo, escapeHtml, icon, qs, qsa, requiredNumber } from '../core/dom.js';
import { faDate, faDateShort, faNumber, money, remainingTime, resourceStatusHint, runtimeStatusHint, translateEnum } from '../core/format.js';
import { parallelSettled } from '../core/query.js';
import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { notify } from '../core/toast.js';
import { openChargeWalletDialog } from '../core/wallet-action.js';
import { userChrome } from '../core/user-chrome.js';
import { badge, card, dataTable, emptyState, field, loadingPage, metricBar, pageHeader, pagination, selectField, statCard, textarea } from '../ui/components.js';
import { renderAppShell } from '../ui/layout.js';
import { bindFileSelection } from '../ui/file-selection.js';
import { renderTicketMessage } from '../ui/ticket-message.js';
import { bindInvoiceTokenCopies, invoiceTokenView } from '../ui/invoice-token.js';

interface ProductDto {
  id?: number; productName?: string; price?: Models.Money; period?: string; productType?: 'TEASPEAK' | 'AUDIO_BOT'; maxClients?: number;
}

type ResourceKind = 'TEASPEAK' | 'AUDIO_BOT';
type UserResourceListItem = Models.ResourceListResponse;
type TeaSpeakResourceDetail = Models.AbstractResourceDetailResponse;

const revealedPrivilegeTokens = new Set<number>();
const resourceKindOf = (resource: UserResourceListItem): ResourceKind => {
  if (resource.resourceType === 'AUDIO_BOT' || resource.resourceType === 'TEASPEAK') return resource.resourceType;
  return resource.productName?.toUpperCase().includes('AUDIO') ? 'AUDIO_BOT' : 'TEASPEAK';
};
interface InvoiceDetailDto {
  invoiceToken?: string; token?: string; status?: string; money?: Models.Money; amount?: Models.Money | number;
  description?: string; createdAt?: string; paidAt?: string; ownerId?: number; paymentTransaction?: Models.PaymentTransactionDetailResponse;
  items?: Array<{ title?: string; description?: string; amount?: Models.Money }>;
}
const objectOf = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const arrayOf = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

function errorNotice(text = 'دریافت بخشی از اطلاعات با خطا مواجه شد. دوباره تلاش کنید.'): string {
  return `<div class="notice notice--warning">${icon('warning')}<span>${escapeHtml(text)}</span><button onclick="location.reload()">تلاش دوباره</button></div>`;
}


type TransactionTypeFilter = NonNullable<Models.WalletTransactionFilterRequest['transactionType']>;
type TransactionReasonFilter = NonNullable<Models.WalletTransactionFilterRequest['transactionReason']>;

interface FinanceFilters {
  transactionType?: TransactionTypeFilter;
  transactionReason?: TransactionReasonFilter;
  fromCreatedAt?: string;
  toCreatedAt?: string;
}

const transactionTypes = new Set<TransactionTypeFilter>(['CREDIT', 'DEBIT']);
const transactionReasons = new Set<TransactionReasonFilter>(['PROLONG', 'PURCHASE', 'WALLET_CHARGE']);

function readFinanceFilters(params = new URLSearchParams(location.search)): FinanceFilters {
  const type = params.get('transactionType') as TransactionTypeFilter | null;
  const reason = params.get('transactionReason') as TransactionReasonFilter | null;
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

function transactionRows(transactions: Models.WalletTransactionResponse[], showResource = true): string {
  return dataTable<Models.WalletTransactionResponse>([
    { label: 'نوع', render: (row) => badge(row.type) },
    { label: 'شرح', render: (row) => `<b>${translateEnum(row.reason)}</b>${showResource && row.relatedResourceId ? `<small class="block">سرویس #${faNumber(row.relatedResourceId)}</small>` : ''}` },
    { label: 'مبلغ', render: (row) => `<strong class="money ${row.type === 'CREDIT' ? 'money--credit' : 'money--debit'}">${row.type === 'CREDIT' ? '+' : '−'} ${money(row.amount)}</strong>` },
    { label: 'تاریخ', render: (row) => faDate(row.createdAt) },
  ], transactions, { emptyTitle: 'تراکنشی وجود ندارد', emptyText: 'برای این محدوده و فیلتر، تراکنشی ثبت نشده است.' });
}

export async function renderUserDashboard(): Promise<void> {
  renderAppShell(loadingPage(), 'نمای کلی');
  try {
    const [overview, walletOverview, ticketsResponse, resourcesResponse] = await Promise.all([
      getUserDashboardOverview(),
      getWalletOverview(),
      api.call('getTickets', { query: { filterRequest: { page: 0, size: 5 } } }),
      api.call('getResources', {}),
    ]);

    const resourceMetric = overview.resourceMetric ?? {};
    const recentTickets = contentOf(ticketsResponse) as Models.TicketListUserResponse[];
    const resources = (dataOf(resourcesResponse) ?? []) as UserResourceListItem[];
    const activeResources = resources
      .filter((resource) => resource.resourceStatus === 'ACTIVE')
      .slice(0, 4);
    const coverageDescription = walletOverview.autoRenewalCoverageUntil
      ? `زمان باقی‌مانده تا اتمام موجودی بر اساس سرویس‌های دارای تمدید خودکار: ${remainingTime(walletOverview.autoRenewalCoverageUntil)}`
      : 'برای سرویس‌های دارای تمدید خودکار، زمان اتمام موجودی هنوز محاسبه نشده است.';

    const activeServicesHtml = activeResources.length
      ? `<div class="dashboard-active-services">${activeResources.map((resource) => {
          const kind = resourceKindOf(resource);
          return `<a data-link href="/panel/services/${resource.id}">
            <span class="dashboard-active-services__icon">${icon(kind === 'AUDIO_BOT' ? 'headphones' : 'dns')}</span>
            <span><b>${escapeHtml(resource.label || resource.productName || `سرویس #${resource.id}`)}</b><small>${escapeHtml(resource.productName || translateEnum(kind))}</small></span>
            ${icon('chevron_left')}
          </a>`;
        }).join('')}</div>`
      : emptyState('سرویس فعالی وجود ندارد', 'پس از فعال‌شدن سرویس، دسترسی سریع آن در این کارت نمایش داده می‌شود.', '<a data-link href="/panel/services" class="button button--secondary button--small">مشاهده سرویس‌ها</a>');

    const recentTicketsHtml = recentTickets.length
      ? `<div class="dashboard-recent-tickets">${recentTickets.map((ticket) => `<a data-link href="/panel/tickets/${ticket.id}">
          <span class="dashboard-recent-tickets__icon">${icon('chat')}</span>
          <span class="dashboard-recent-tickets__subject"><b>${escapeHtml(ticket.subject || `تیکت #${ticket.id}`)}</b><small>${translateEnum(ticket.department)} · تیکت #${faNumber(ticket.id)}</small></span>
          <span class="dashboard-recent-tickets__status">${badge(ticket.status)}</span>
          <time>${faDate(ticket.lastModified || ticket.createdAt)}</time>
          ${icon('chevron_left')}
        </a>`).join('')}</div>`
      : emptyState('تیکتی ثبت نشده است', 'پنج تیکت اخیر شما در این بخش نمایش داده می‌شوند.', '<a data-link href="/panel/tickets" class="button button--secondary button--small">رفتن به پشتیبانی</a>');

    renderAppShell(`
      ${pageHeader('داشبورد نمای کلی', 'وضعیت سرویس‌ها، کیف پول و درخواست‌های پشتیبانی حساب شما.', [{ label: 'مشاهده محصولات', icon: 'shopping_bag', href: '/panel/products' }])}
      <div class="stats-grid">
        ${statCard('موجودی کیف پول', money(walletOverview.balance), 'account_balance_wallet', coverageDescription, 'blue').replace('<strong>', '<strong data-wallet-overview-balance>').replace('<small>', '<small data-wallet-overview-coverage>')}
        ${statCard('سرویس‌های فعال', faNumber(resourceMetric.active), 'teacloud', `${faNumber(resourceMetric.total)} سرویس در مجموع`, 'cyan')}
        ${statCard('سرویس‌های تعلیق‌شده', faNumber(resourceMetric.suspended), 'pause_circle', 'سرویس‌هایی که نیازمند بررسی هستند', 'purple')}
        ${statCard('تیکت‌های باز', faNumber(overview.openTickets), 'support_agent', 'در انتظار پاسخ یا اقدام', 'orange')}
      </div>
      <div class="dashboard-grid dashboard-grid--bottom">
        ${card('سرویس‌های فعال', activeServicesHtml, { icon: 'dns', actions: '<a data-link class="button button--ghost button--small" href="/panel/services">همه سرویس‌ها</a>', className: 'dashboard-active-services-card' })}
        ${card('اعلان‌های عمومی', `<div data-overview-notifications><div class="notification-empty">${icon('hourglass_top')}<b>در حال دریافت اعلان‌ها</b><span>آخرین پیام‌های عمومی سامانه در این بخش نمایش داده می‌شوند.</span></div></div>`, { icon: 'notifications', actions: '<button type="button" class="button button--ghost button--small" data-user-notifications-open>مشاهده همه</button>' })}
      </div>
      ${card('تیکت‌های اخیر', recentTicketsHtml, { icon: 'forum', actions: '<a data-link class="button button--ghost button--small" href="/panel/tickets">همه تیکت‌ها</a>', className: 'dashboard-recent-tickets-card' })}
    `, 'نمای کلی');
  } catch (error) {
    renderAppShell(`${pageHeader('داشبورد نمای کلی', 'اطلاعات حساب')}${errorNotice(error instanceof ApiError ? error.message : undefined)}`, 'نمای کلی');
  }
}

export async function renderServices(): Promise<void> {
  renderAppShell(loadingPage(), 'سرویس‌های من');
  try {
    const response = await api.call('getResources', {});
    const resources = (dataOf(response) ?? []) as UserResourceListItem[];
    const teaSpeakResources = resources.filter((resource) => resourceKindOf(resource) === 'TEASPEAK');
    const audioBotResources = resources.filter((resource) => resourceKindOf(resource) === 'AUDIO_BOT');
    const activeCount = resources.filter((resource) => resource.resourceStatus === 'ACTIVE').length;
    const pendingCount = resources.filter((resource) => resource.resourceStatus === 'DEPLOYING' || resource.resourceStatus === 'PENDING_PROLONG').length;

    const resourceTable = (items: UserResourceListItem[], kind: ResourceKind): string => dataTable<UserResourceListItem>([
      {
        label: 'سرویس',
        render: (resource) => `<a data-link class="table-primary" href="/panel/services/${resource.id}">${icon(kind === 'AUDIO_BOT' ? 'headphones' : 'dns')}<span><b>${escapeHtml(resource.label || resource.productName || 'سرویس بدون نام')}</b><small>${escapeHtml(resource.productName || translateEnum(kind))}</small></span></a>`,
      },
      { label: 'وضعیت', render: (resource) => badge(resource.resourceStatus) },
      { label: 'دوره', render: (resource) => badge(resource.period) },
      { label: 'تاریخ انقضا', render: (resource) => `<span class="expiration-cell"><b>${faDate(resource.expiration)}</b><small>${escapeHtml(remainingTime(resource.expiration))}</small></span>` },
      { label: 'شناسه', render: (resource) => `<span class="ltr strong">#${faNumber(resource.id)}</span>` },
      { label: '', className: 'table-actions-cell', render: (resource) => `<a data-link class="button button--secondary button--small" href="/panel/services/${resource.id}">مدیریت ${icon('chevron_left')}</a>` },
    ], items, {
      emptyTitle: kind === 'TEASPEAK' ? 'سرور TeaSpeak ندارید' : 'سرویس AudioBot ندارید',
      emptyText: kind === 'TEASPEAK'
        ? 'پس از تهیه یک محصول TeaSpeak، سرورهای شما در این جدول نمایش داده می‌شوند.'
        : 'پس از تهیه یک محصول AudioBot، ربات‌های شما در این جدول نمایش داده می‌شوند.',
    });

    renderAppShell(`${pageHeader('سرویس‌های من', 'سرورهای TeaSpeak و سرویس‌های AudioBot در دو فهرست مستقل مدیریت می‌شوند.', [{ label: 'افزودن سرویس', icon: 'add', href: '/panel/products' }])}
      <div class="stats-grid service-metrics">
        ${statCard('کل سرویس‌ها', faNumber(resources.length), 'apps', 'تمام سرویس‌های حساب', 'blue')}
        ${statCard('TeaSpeak', faNumber(teaSpeakResources.length), 'dns', 'سرورهای صوتی', 'cyan')}
        ${statCard('AudioBot', faNumber(audioBotResources.length), 'headphones', 'ربات‌های موسیقی', 'purple')}
        ${statCard('فعال / نیازمند توجه', `${faNumber(activeCount)} / ${faNumber(pendingCount)}`, 'monitor_heart', 'فعال، در حال استقرار یا تمدید', 'orange')}
      </div>
      <div class="service-tables">
        ${card('سرورهای TeaSpeak', resourceTable(teaSpeakResources, 'TEASPEAK'), { icon: 'dns', className: 'service-table-card' })}
        ${card('سرویس‌های AudioBot', resourceTable(audioBotResources, 'AUDIO_BOT'), { icon: 'headphones', className: 'service-table-card' })}
      </div>`, 'سرویس‌های من');
  } catch (error) {
    renderAppShell(`${pageHeader('سرویس‌های من', 'مدیریت سرویس‌ها')}${errorNotice(error instanceof ApiError ? error.message : undefined)}`, 'سرویس‌های من');
  }
}

async function loadAllProducts(): Promise<Array<{ category: Models.CategoryListResponse; product: ProductDto }>> {
  const categories = dataOf(await api.call('getCategories', {})) ?? [];
  const result: Array<{ category: Models.CategoryListResponse; product: ProductDto }> = [];
  await Promise.all(categories.map(async (category) => {
    if (!category.slug) return;
    const response = await api.call('getProductByCategorySlug', { path: { categorySlug: category.slug } });
    const payload = objectOf(response); const products = arrayOf<ProductDto>(payload.data);
    products.forEach((product) => result.push({ category, product }));
  }));
  return result;
}

async function openNewServiceDialog(): Promise<void> {
  const dialog = openDialog({ title: 'راه‌اندازی سرویس جدید', description: 'محصول و مشخصات سرویس را انتخاب کنید.', content: '<div class="dialog-loading"><span class="spinner"></span>در حال دریافت محصولات...</div>', confirmLabel: 'ایجاد سرویس', wide: true, onConfirm: async (element) => {
    const form = qs<HTMLFormElement>('form', element); if (!form.reportValidity()) return false;
    const data = new FormData(form); const type = String(data.get('type')) as 'TEASPEAK' | 'AUDIO_BOT';
    const body: Record<string, unknown> = { type, productId: requiredNumber(data.get('productId')), label: String(data.get('label') ?? '') };
    if (type === 'AUDIO_BOT') Object.assign(body, { botNickname: String(data.get('botNickname') ?? ''), serverAddress: String(data.get('serverAddress') ?? ''), serverPassword: String(data.get('serverPassword') ?? '') || undefined });
    const response = await runAction(() => api.call('newResource', { body: body as unknown as Models.AbstractNewResourceRequest }));
    if (!response) return false; await renderServices(); return true;
  }});
  try {
    const products = await loadAllProducts();
    const content = qs<HTMLElement>('.dialog__content', dialog);
    content.innerHTML = `<form class="form-grid"><label class="field field--full"><span>محصول</span><select name="productId" id="product-select" required><option value="">انتخاب کنید</option>${products.map(({ category, product }) => `<option value="${product.id}" data-type="${escapeHtml(product.productType)}">${escapeHtml(product.productName)} — ${money(product.price)} / ${escapeHtml(translateEnum(product.period))} (${escapeHtml(category.name)})</option>`).join('')}</select></label>${field('label','نام نمایشی سرویس',{required:true,placeholder:'مثلاً سرور تیم ما'})}<input type="hidden" name="type" id="resource-type"/><div class="audio-fields field--full" hidden>${field('botNickname','نام ربات',{placeholder:'Music Bot'})}${field('serverAddress','آدرس سرور',{placeholder:'example.com:9987',dir:'ltr'})}${field('serverPassword','رمز سرور (اختیاری)',{type:'password',dir:'ltr'})}</div></form>`;
    const select = qs<HTMLSelectElement>('#product-select', dialog); const typeInput = qs<HTMLInputElement>('#resource-type', dialog); const audioFields = qs<HTMLElement>('.audio-fields', dialog);
    select.addEventListener('change', () => { const option = select.selectedOptions[0]; const type = option?.dataset.type ?? ''; typeInput.value = type; audioFields.hidden = type !== 'AUDIO_BOT'; });
  } catch (error) { qs<HTMLElement>('.dialog__content', dialog).innerHTML = errorNotice(error instanceof ApiError ? error.message : undefined); }
}

function teaSpeakConnectionEndpoint(resource: TeaSpeakResourceDetail): string {
  const address = resource.address?.trim();
  const port = resource.port == null ? '' : String(resource.port);
  if (!address && !port) {
    return `<div class="teaspeak-connection teaspeak-connection--inline"><div class="teaspeak-connection__empty">${icon('lan')}<span><b>اطلاعات اتصال هنوز آماده نیست</b><small>پس از تکمیل استقرار، آدرس و پورت در همین بخش نمایش داده می‌شود.</small></span></div></div>`;
  }
  const endpoint = [address, port].filter(Boolean).join(':');
  return `<div class="teaspeak-connection teaspeak-connection--inline"><div class="teaspeak-connection__endpoint"><span>${icon('lan')}<small>آدرس اتصال TeaSpeak</small></span><code dir="ltr">${escapeHtml(endpoint)}</code><button type="button" class="icon-button" data-copy-connection="${escapeHtml(endpoint)}" aria-label="کپی آدرس اتصال" title="کپی آدرس و پورت">${icon('content_copy')}</button></div></div>`;
}

function privilegeTokenPanel(resource: TeaSpeakResourceDetail): string {
  const resourceId = Number(resource.id ?? 0);
  const token = resource.privilegeToken?.token?.trim();
  if (!token) {
    return card('Privilege Token', emptyState('توکنی دریافت نشده است', 'با ساخت یک Privilege جدید، توکن مدیریت TeaSpeak در این بخش نمایش داده می‌شود.', '<button type="button" class="button button--secondary button--small" data-service-action="privilege">ساخت Privilege</button>'), { icon: 'key', className: 'privilege-card' });
  }
  const revealed = revealedPrivilegeTokens.has(resourceId);
  return card('Privilege Token', `<div class="privilege-token ${revealed ? 'privilege-token--revealed' : ''}" data-privilege-token>
    <div class="privilege-token__meta">${icon('vpn_key')}<span><b>توکن دسترسی مدیریتی</b><small>${revealed ? 'توکن قابل مشاهده است؛ آن را محرمانه نگه دارید.' : 'برای مشاهده روی توکن یا دکمه نمایش کلیک کنید.'}</small></span></div>
    <button type="button" class="privilege-token__value" data-reveal-privilege aria-pressed="${revealed}" aria-label="${revealed ? 'مخفی‌کردن توکن' : 'نمایش توکن'}"><code dir="ltr">${escapeHtml(token)}</code><span>${icon(revealed ? 'visibility_off' : 'visibility')}${revealed ? 'مخفی‌کردن' : 'نمایش توکن'}</span></button>
    <div class="privilege-token__actions"><button type="button" class="button button--ghost button--small" data-copy-privilege ${revealed ? '' : 'disabled'}>${icon('content_copy')} کپی</button><button type="button" class="button button--secondary button--small" data-service-action="privilege">${icon('autorenew')} ساخت توکن جدید</button></div>
  </div>`, { icon: 'key', className: 'privilege-card' });
}

function serviceLabelEditor(resource: TeaSpeakResourceDetail): string {
  return `<form class="service-label-editor" data-service-label-form>
    <div>${icon('label')}<span><small>نام نمایشی سرویس</small><input name="label" value="${escapeHtml(resource.label || '')}" readonly required maxlength="80" aria-label="نام نمایشی سرویس" /></span></div>
    <div class="service-label-editor__actions">
      <button type="button" class="icon-button" data-service-label-edit aria-label="ویرایش نام" title="ویرایش نام">${icon('edit')}</button>
      <button type="submit" class="icon-button service-label-editor__save" data-service-label-save aria-label="ذخیره نام" title="ذخیره نام" hidden>${icon('check')}</button>
      <button type="button" class="icon-button service-label-editor__cancel" data-service-label-cancel aria-label="انصراف" title="انصراف" hidden>${icon('close')}</button>
    </div>
  </form>`;
}

export async function renderServiceDetail(resourceId: number): Promise<void> {
  renderAppShell(loadingPage(), 'جزئیات سرویس');
  try {
    const [response, transactionsResponse] = await Promise.all([
      api.call('getResourceById', { path: { resourceId } }),
      api.call('getWalletTransactions', { query: { filter: { page: 0, size: 10, relatedResourceId: resourceId } } }),
    ]);
    const resource = dataOf(response) as TeaSpeakResourceDetail | undefined;
    const resourceTransactions = contentOf(transactionsResponse);
    if (!resource) throw new Error('اطلاعات سرویس دریافت نشد.');
    const isAudio = resource.resourceType === 'AUDIO_BOT';
    const isTeaSpeak = resource.resourceType === 'TEASPEAK';
    const teaSpeakStatus = resource.teaSpeakStatus?.toUpperCase();
    let playlists: Models.ABPlayListsResponse[] = [];
    if (isAudio) {
      try { playlists = dataOf(await api.call('getAudioBotPlaylists', { path: { resourceId } })) ?? []; }
      catch { playlists = []; }
    }

    const powerActions = isTeaSpeak
      ? teaSpeakStatus === 'ONLINE'
        ? `<button class="quick-action quick-action--danger" data-service-action="stop">${icon('stop_circle')}<span><b>خاموش‌کردن</b><small>توقف امن TeaSpeak</small></span></button>`
        : teaSpeakStatus === 'OFFLINE'
          ? `<button class="quick-action quick-action--success" data-service-action="start">${icon('play_circle')}<span><b>روشن‌کردن</b><small>راه‌اندازی TeaSpeak</small></span></button>`
          : ''
      : `<button class="quick-action quick-action--success" data-service-action="start">${icon('play_arrow')}<span><b>شروع</b><small>راه‌اندازی AudioBot</small></span></button><button class="quick-action quick-action--danger" data-service-action="stop">${icon('stop')}<span><b>توقف</b><small>خاموش‌کردن AudioBot</small></span></button>`;

    const lifecycleText = resourceStatusHint(resource.resourceStatus);
    const runtimeBlock = isTeaSpeak
      ? `<div class="service-runtime-state"><span>وضعیت TeaSpeak</span>${badge(resource.teaSpeakStatus)}<p>${escapeHtml(runtimeStatusHint(resource.teaSpeakStatus))}</p></div>`
      : '';

    renderAppShell(`${pageHeader(resource.productName || 'جزئیات سرویس', `${translateEnum(resource.resourceType)} — شناسه ${faNumber(resource.id)}`, [{ label: 'بازگشت', icon: 'arrow_forward', href: '/panel/services', variant: 'ghost' }])}${serviceLabelEditor(resource)}
      <div class="detail-grid"><div class="detail-main">
        ${card('وضعیت سرویس', `<div class="service-status-hero"><div class="service-status-hero__icon">${icon(isAudio ? 'headphones' : 'dns')}</div><div><span>چرخه سرویس</span>${badge(resource.resourceStatus)}<p>${escapeHtml(lifecycleText)}</p></div></div>${runtimeBlock}<div class="quick-actions quick-actions--service">${powerActions}<button class="quick-action ${resource.autoProlong ? 'quick-action--success' : ''}" data-service-action="auto-prolong">${icon(resource.autoProlong ? 'autorenew' : 'update_disabled')}<span><b>${resource.autoProlong ? 'تمدید خودکار فعال' : 'فعال‌کردن تمدید خودکار'}</b><small>${resource.autoProlong ? 'برای غیرفعال‌کردن کلیک کنید' : 'تمدید دوره‌ای سرویس'}</small></span></button><button class="quick-action" data-service-action="prolong">${icon('event_repeat')}<span><b>تمدید</b><small>تمدید دوره سرویس</small></span></button>${isAudio ? `<button class="quick-action" data-service-action="audio-settings">${icon('tune')}<span><b>تنظیمات اتصال</b><small>ویرایش اتصال AudioBot</small></span></button>` : ''}${isTeaSpeak ? `<button class="quick-action" data-service-action="privilege">${icon('key')}<span><b>Privilege جدید</b><small>ساخت توکن دسترسی</small></span></button>` : ''}</div>${isTeaSpeak ? teaSpeakConnectionEndpoint(resource) : ''}`, { icon: 'monitor_heart' })}
        ${isTeaSpeak ? privilegeTokenPanel(resource) : ''}
        ${isAudio ? card('Playlistهای AudioBot', `<div class="playlist-grid">${playlists.map((playlist) => `<article class="playlist-card"><span>${icon('queue_music')}</span><div><b>${escapeHtml(playlist.title || playlist.playlistFilename)}</b><small>${faNumber(playlist.songCount)} قطعه</small></div><button class="icon-button" data-playlist="${escapeHtml(playlist.playlistFilename)}">${icon('chevron_left')}</button></article>`).join('') || emptyState('Playlist ندارید', 'یک Playlist بسازید و لینک قطعه‌های صوتی را به آن اضافه کنید.')} </div>`, { icon: 'library_music', actions: '<button id="new-playlist" class="button button--secondary button--small">ساخت Playlist</button>' }) : ''}
        ${card('تراکنش‌های این سرویس', transactionRows(resourceTransactions, false), { icon: 'receipt_long', className: 'service-transactions-card', actions: '<a data-link class="button button--ghost button--small" href="/panel/finance?tab=transactions">همه تراکنش‌ها</a>' })}
      </div><aside class="detail-aside">
        ${card('مشخصات سرویس', `<dl class="description-list"><div><dt>محصول</dt><dd>${escapeHtml(resource.productName)}</dd></div><div><dt>نوع سرویس</dt><dd>${translateEnum(resource.resourceType)}</dd></div>${isTeaSpeak ? `<div><dt>ظرفیت کاربران</dt><dd>${resource.maxClients == null ? '—' : faNumber(resource.maxClients)}</dd></div><div><dt>آدرس اتصال</dt><dd class="ltr">${escapeHtml(resource.address || '—')}</dd></div><div><dt>پورت اتصال</dt><dd class="ltr">${resource.port == null ? '—' : faNumber(resource.port)}</dd></div>` : ''}<div><dt>دوره سرویس</dt><dd>${badge(resource.period)}</dd></div><div><dt>تاریخ سفارش</dt><dd>${faDate(resource.orderDate)}</dd></div><div><dt>تاریخ انقضا</dt><dd><span class="expiration-cell"><b>${faDate(resource.expiration)}</b><small>${escapeHtml(remainingTime(resource.expiration))}</small></span></dd></div><div><dt>تمدید خودکار</dt><dd>${resource.autoProlong ? badge('ACTIVE') : badge('DISABLED')}</dd></div></dl>`, { icon: 'info' })}
        ${card('راهنمای سریع', `<div class="help-box">${icon('support_agent')}<p>برای مشکل فنی این سرویس، یک تیکت مرتبط ثبت کنید تا تیم پشتیبانی اطلاعات سرویس را مشاهده کند.</p><a data-link href="/panel/tickets?resource=${resource.id}" class="text-link">ارسال تیکت مرتبط</a></div>`, { icon: 'help' })}
      </aside></div>`, resource.label || 'جزئیات سرویس');
    bindServiceActions(resource);
    if (isTeaSpeak) { bindTeaSpeakConnection(); bindPrivilegeToken(resource); }
    if (isAudio) bindPlaylistActions(resourceId, playlists);
  } catch (error) {
    renderAppShell(`${pageHeader('جزئیات سرویس', 'اطلاعات سرویس')}${errorNotice(error instanceof ApiError ? error.message : undefined)}`, 'جزئیات سرویس');
  }
}

function bindTeaSpeakConnection(): void {
  qsa<HTMLButtonElement>('[data-copy-connection]').forEach((button) => button.addEventListener('click', async () => {
    const value = button.dataset.copyConnection?.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      notify('اطلاعات اتصال کپی شد.', 'success');
    } catch {
      notify('کپی خودکار انجام نشد؛ مقدار را به‌صورت دستی انتخاب کنید.', 'warning');
    }
  }));
}

function bindPrivilegeToken(resource: TeaSpeakResourceDetail): void {
  const resourceId = Number(resource.id ?? 0);
  const token = resource.privilegeToken?.token?.trim();
  const reveal = document.querySelector<HTMLButtonElement>('[data-reveal-privilege]');
  reveal?.addEventListener('click', () => {
    if (revealedPrivilegeTokens.has(resourceId)) revealedPrivilegeTokens.delete(resourceId);
    else revealedPrivilegeTokens.add(resourceId);
    const container = document.querySelector<HTMLElement>('[data-privilege-token]');
    const isRevealed = revealedPrivilegeTokens.has(resourceId);
    container?.classList.toggle('privilege-token--revealed', isRevealed);
    reveal.setAttribute('aria-pressed', String(isRevealed));
    reveal.setAttribute('aria-label', isRevealed ? 'مخفی‌کردن توکن' : 'نمایش توکن');
    const action = reveal.querySelector('span');
    if (action) action.innerHTML = `${icon(isRevealed ? 'visibility_off' : 'visibility')}${isRevealed ? 'مخفی‌کردن' : 'نمایش توکن'}`;
    const copy = document.querySelector<HTMLButtonElement>('[data-copy-privilege]');
    if (copy) copy.disabled = !isRevealed;
  });
  document.querySelector<HTMLButtonElement>('[data-copy-privilege]')?.addEventListener('click', async () => {
    if (!token || !revealedPrivilegeTokens.has(resourceId)) return;
    try {
      await navigator.clipboard.writeText(token);
      notify('Privilege Token در کلیپ‌بورد کپی شد.', 'success');
    } catch {
      notify('کپی خودکار انجام نشد؛ توکن را به‌صورت دستی انتخاب کنید.', 'warning');
    }
  });
}

function bindServiceActions(resource: TeaSpeakResourceDetail): void {
  qsa<HTMLButtonElement>('[data-service-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.serviceAction;
    const resourceId = Number(resource.id);
    if (action === 'prolong') return confirmDialog('تمدید سرویس', 'هزینه تمدید از کیف پول کسر می‌شود. ادامه می‌دهید؟', 'تمدید سرویس', async () => { if (await runAction(() => api.call('prolongResource', { path: { resourceId } }))) await renderServiceDetail(resourceId); });
    if (action === 'auto-prolong') {
      const enabled = !Boolean(resource.autoProlong);
      return confirmDialog(enabled ? 'فعال‌کردن تمدید خودکار' : 'غیرفعال‌کردن تمدید خودکار', enabled ? 'سرویس در پایان هر دوره به‌صورت خودکار تمدید شود؟' : 'تمدید خودکار این سرویس متوقف شود؟', enabled ? 'فعال‌کردن' : 'غیرفعال‌کردن', async () => {
        if (await runAction(() => api.call('prolongResource_1', { path: { resourceId }, body: { autoProlong: enabled } }))) await renderServiceDetail(resourceId);
      }, !enabled);
    }
    if (action === 'audio-settings') {
      void openAudioEdit(resourceId);
      return;
    }
    if (action === 'privilege') return confirmDialog('ساخت Privilege جدید', 'برای این سرور یک توکن دسترسی جدید ساخته شود؟', 'ساخت توکن', async () => {
      if (await runAction(() => api.call('newPrivilege', { path: { resourceId } }))) {
        revealedPrivilegeTokens.delete(resourceId);
        await renderServiceDetail(resourceId);
      }
    });
    if (action !== 'start' && action !== 'stop') return;
    const start = action === 'start';
    const operation = resource.resourceType === 'AUDIO_BOT'
      ? (start ? 'startAudioBot' : 'stopAudioBot')
      : (start ? 'startTeaSpeak' : 'stopTeaSpeak');
    confirmDialog(start ? 'روشن‌کردن سرویس' : 'خاموش‌کردن سرویس', start ? 'سرویس راه‌اندازی شود؟' : 'توقف سرویس ممکن است ارتباط کاربران را قطع کند.', start ? 'روشن‌کردن' : 'خاموش‌کردن', async () => {
      if (await runAction(() => api.call(operation, { path: { resourceId } } as never))) await renderServiceDetail(resourceId);
    }, !start);
  }));

  const form = document.querySelector<HTMLFormElement>('[data-service-label-form]');
  const input = form?.querySelector<HTMLInputElement>('input[name="label"]');
  const edit = form?.querySelector<HTMLButtonElement>('[data-service-label-edit]');
  const save = form?.querySelector<HTMLButtonElement>('[data-service-label-save]');
  const cancel = form?.querySelector<HTMLButtonElement>('[data-service-label-cancel]');
  const original = resource.label || '';
  const setEditing = (editing: boolean): void => {
    if (!form || !input || !edit || !save || !cancel) return;
    form.classList.toggle('service-label-editor--editing', editing);
    input.readOnly = !editing;
    edit.hidden = editing;
    save.hidden = !editing;
    cancel.hidden = !editing;
    if (editing) { input.focus(); input.select(); }
  };
  edit?.addEventListener('click', () => setEditing(true));
  cancel?.addEventListener('click', () => { if (input) input.value = original; setEditing(false); });
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!input || !input.value.trim()) { input?.focus(); return; }
    const response = await runAction(() => api.call('prolongResource_1', { path: { resourceId: Number(resource.id) }, body: { label: input.value.trim() } }));
    if (response) await renderServiceDetail(Number(resource.id));
  });
}

async function openAudioEdit(resourceId: number): Promise<void> {
  const form = document.createElement('form'); form.className = 'form-grid'; form.innerHTML = `${field('botNickname','نام ربات')}${field('serverAddress','آدرس سرور',{dir:'ltr'})}${field('serverPassword','رمز سرور',{type:'password',dir:'ltr'})}`;
  openDialog({ title: 'تنظیمات اتصال AudioBot', content: form, confirmLabel: 'ذخیره', onConfirm: async () => {
    const data = new FormData(form); return Boolean(await runAction(() => api.call('editAudioBot', { path: { resourceId }, body: { botNickname: String(data.get('botNickname') ?? ''), serverAddress: String(data.get('serverAddress') ?? ''), serverPassword: String(data.get('serverPassword') ?? '') } }))) || false;
  }});
}

function bindPlaylistActions(resourceId: number, playlists: Models.ABPlayListsResponse[]): void {
  document.querySelector('#new-playlist')?.addEventListener('click', () => {
    const form = document.createElement('form'); form.innerHTML = field('playlistName','نام Playlist',{required:true});
    openDialog({ title: 'ساخت Playlist', content: form, confirmLabel: 'ساخت', onConfirm: async () => { if (!form.reportValidity()) return false; const data = new FormData(form); if (!await runAction(() => api.call('addAudioBotPlaylist', { path: { resourceId }, body: { playlistName: String(data.get('playlistName') ?? '') } }))) return false; await renderServiceDetail(resourceId); return true; } });
  });
  qsa<HTMLButtonElement>('[data-playlist]').forEach((button) => button.addEventListener('click', async () => {
    const filename = button.dataset.playlist ?? ''; const playlist = playlists.find((item) => item.playlistFilename === filename);
    const dialog = openDialog({ title: playlist?.title || filename, description: 'قطعه‌های Playlist و عملیات مدیریت', content: '<div class="dialog-loading"><span class="spinner"></span>در حال دریافت...</div>', wide: true });
    try {
      const response = await api.call('getAudioBotPlaylistDetail', { path: { resourceId, playlistFilename: filename }, body: { page: 0, size: 100 } }); const detail = dataOf(response);
      const content = qs<HTMLElement>('.dialog__content', dialog);
      content.innerHTML = `<div class="dialog-toolbar"><button id="add-track" class="button button--primary button--small">${icon('add')} افزودن Track</button><button id="delete-playlist" class="button button--danger button--small">${icon('delete')} حذف Playlist</button></div>${dataTable<Models.ABPlayListItemResponse>([{label:'#',render:r=>faNumber(r.order)},{label:'عنوان',render:r=>`<b>${escapeHtml(r.title)}</b><small class="block ltr">${escapeHtml(r.link)}</small>`},{label:'نوع',render:r=>escapeHtml(r.audioType)}], detail?.playListItems ?? [])}`;
      content.querySelector('#add-track')?.addEventListener('click', () => { const form=document.createElement('form'); form.innerHTML=field('trackLink','لینک Track',{required:true,dir:'ltr',placeholder:'https://...'}); openDialog({title:'افزودن Track',content:form,confirmLabel:'افزودن',onConfirm:async()=>{if(!form.reportValidity())return false; const data=new FormData(form); const ok=await runAction(()=>api.call('addTrackToAudioBotPlaylist',{path:{resourceId,playlistFilename:filename},body:{trackLink:String(data.get('trackLink')??'')}})); return Boolean(ok);}}); });
      content.querySelector('#delete-playlist')?.addEventListener('click', () => confirmDialog('حذف Playlist','این عملیات برگشت‌پذیر نیست.','حذف',async()=>{if(await runAction(()=>api.call('deleteAudioBotPlaylist',{path:{resourceId,playlistFilename:filename}}))){dialog.close();await renderServiceDetail(resourceId);}},true));
    } catch (error) { qs<HTMLElement>('.dialog__content', dialog).innerHTML = errorNotice(error instanceof ApiError ? error.message : undefined); }
  }));
}

export async function renderProducts(categorySlug = ''): Promise<void> {
  renderAppShell(loadingPage(), 'محصولات');
  try {
    const categories = dataOf(await api.call('getCategories', {})) ?? [];
    store.setProductCategories(categories.flatMap((category) => category.name && category.slug ? [{ name: category.name, slug: category.slug }] : []));
    const selectedSlug = categorySlug || categories[0]?.slug || '';
    const selectedCategory = categories.find((category) => category.slug === selectedSlug);
    const productsResponse = selectedSlug ? await api.call('getProductByCategorySlug', { path: { categorySlug: selectedSlug } }) : undefined;
    const products = arrayOf<ProductDto>(objectOf(productsResponse).data);
    renderAppShell(`${pageHeader('محصولات', selectedCategory?.description || 'دسته موردنظر را انتخاب و محصول مناسب را راه‌اندازی کنید.')}
      <div class="product-browser">
        <aside class="product-category-panel"><header>${icon('category')}<div><b>دسته‌بندی محصولات</b><small>${faNumber(categories.length)} دسته فعال</small></div></header><nav>${categories.map((category) => `<a data-link class="${category.slug === selectedSlug ? 'active' : ''}" href="/panel/products/${encodeURIComponent(category.slug ?? '')}">${icon(category.name?.toLowerCase().includes('audio') ? 'headphones' : 'dns')}<span><b>${escapeHtml(category.name)}</b><small>${escapeHtml(category.description)}</small></span>${icon('chevron_left')}</a>`).join('') || '<p class="muted">دسته‌بندی فعالی وجود ندارد.</p>'}</nav></aside>
        <section><div class="pricing-grid">${products.map((product, index) => `<article class="pricing-card ${index === 0 ? 'pricing-card--featured' : ''}">${index === 0 ? '<span class="pricing-card__badge">پیشنهاد ابر چایی</span>' : ''}<div class="pricing-card__icon">${icon(product.productType === 'AUDIO_BOT' ? 'headphones' : 'dns')}</div><h3>${escapeHtml(product.productName)}</h3><p>${product.productType === 'TEASPEAK' ? `مناسب تیم‌ها و کامیونیتی‌ها با ظرفیت ${faNumber(product.maxClients)} کاربر` : 'ربات موسیقی مدیریت‌شده با کنترل Playlist و اتصال پایدار'}</p><div class="pricing-card__price"><b>${money(product.price).replace(' تومان','')}</b><span>تومان / ${escapeHtml(translateEnum(product.period))}</span></div><ul><li>${icon('check')} راه‌اندازی خودکار</li><li>${icon('check')} پنل مدیریت کامل</li><li>${icon('check')} تمدید خودکار اختیاری</li><li>${icon('check')} پشتیبانی فارسی</li></ul><button type="button" class="button ${index === 0 ? 'button--primary' : 'button--secondary'} button--block" data-buy-product="${product.id}" data-product-type="${product.productType}" data-product-name="${escapeHtml(product.productName)}">انتخاب و راه‌اندازی ${icon('arrow_back')}</button></article>`).join('') || emptyState('محصولی در این دسته وجود ندارد', 'پاسخ NO_DATA به‌عنوان حالت خالی نمایش داده می‌شود و خطا محسوب نمی‌شود.')}</div></section>
      </div>`, 'محصولات');
    qsa<HTMLButtonElement>('[data-buy-product]').forEach((button) => button.addEventListener('click', () => openPurchaseDialog({ id: Number(button.dataset.buyProduct), productType: button.dataset.productType as ProductDto['productType'], productName: button.dataset.productName })));
  } catch (error) { renderAppShell(`${pageHeader('محصولات', 'فهرست محصولات')}${errorNotice(error instanceof ApiError ? error.message : undefined)}`, 'محصولات'); }
}

function openPurchaseDialog(product: ProductDto): void {
  const form = document.createElement('form'); form.className = 'form-grid';
  form.innerHTML = `${field('label','نام نمایشی سرویس',{required:true,placeholder:'مثلاً سرور دوستان'})}${product.productType === 'AUDIO_BOT' ? `${field('botNickname','نام ربات',{required:true})}${field('serverAddress','آدرس سرور',{required:true,dir:'ltr',placeholder:'host:port'})}${field('serverPassword','رمز سرور (اختیاری)',{type:'password',dir:'ltr'})}` : ''}`;
  openDialog({ title: `راه‌اندازی ${product.productName ?? 'سرویس'}`, description: 'پس از تأیید، هزینه طبق محصول انتخابی محاسبه می‌شود.', content: form, confirmLabel: 'تأیید خرید', onConfirm: async () => {
    if (!form.reportValidity()) return false; const data = new FormData(form);
    const body: Record<string, unknown> = { type: product.productType, productId: product.id, label: String(data.get('label') ?? '') };
    if (product.productType === 'AUDIO_BOT') Object.assign(body, { botNickname: String(data.get('botNickname') ?? ''), serverAddress: String(data.get('serverAddress') ?? ''), serverPassword: String(data.get('serverPassword') ?? '') || undefined });
    const response = await runAction(() => api.call('newResource', { body: body as unknown as Models.AbstractNewResourceRequest }));
    if (!response) return false; router.navigate('/panel/services'); return true;
  }});
}

export async function renderFinance(page = 0, tab: 'transactions' | 'invoices' = 'transactions'): Promise<void> {
  renderAppShell(loadingPage(), 'مالی');
  try {
    const filters = readFinanceFilters();
    const transactionFilter: Models.WalletTransactionFilterRequest = {
      page: tab === 'transactions' ? page : 0,
      size: 20,
      transactionType: filters.transactionType,
      transactionReason: filters.transactionReason,
      fromCreatedAt: apiDateTime(filters.fromCreatedAt),
      toCreatedAt: apiDateTime(filters.toCreatedAt),
    };

    const [walletOverview, transactionsResponse, invoicesResponse] = await Promise.all([
      getWalletOverview(),
      tab === 'transactions'
        ? api.call('getWalletTransactions', { query: { filter: transactionFilter } })
        : Promise.resolve(undefined),
      api.call('getInvoices', { query: { filterRequest: { page: tab === 'invoices' ? page : 0, size: 20 } } }),
    ]);

    userChrome.setWalletOverview(walletOverview);
    const transactions = transactionsResponse ? contentOf(transactionsResponse) : [];
    const transactionMeta = transactionsResponse ? pageOf(transactionsResponse) : { number: 0, totalPages: 0, totalElements: 0, size: 20 };
    const invoices = contentOf(invoicesResponse);
    const invoiceMeta = pageOf(invoicesResponse);

    const financeFilterToolbar = tab === 'transactions' ? `<form id="finance-filter-form" class="finance-filter-toolbar" aria-label="فیلتر تراکنش‌های کیف پول">
      <label><span>نوع</span><select name="transactionType"><option value="" ${!filters.transactionType ? 'selected' : ''}>همه</option><option value="CREDIT" ${filters.transactionType === 'CREDIT' ? 'selected' : ''}>افزایش</option><option value="DEBIT" ${filters.transactionType === 'DEBIT' ? 'selected' : ''}>کاهش</option></select></label>
      <label><span>دلیل</span><select name="transactionReason"><option value="" ${!filters.transactionReason ? 'selected' : ''}>همه</option><option value="PROLONG" ${filters.transactionReason === 'PROLONG' ? 'selected' : ''}>تمدید</option><option value="PURCHASE" ${filters.transactionReason === 'PURCHASE' ? 'selected' : ''}>خرید</option><option value="WALLET_CHARGE" ${filters.transactionReason === 'WALLET_CHARGE' ? 'selected' : ''}>شارژ</option></select></label>
      <label class="finance-filter-toolbar__date"><span>از</span><input name="fromCreatedAt" type="datetime-local" value="${escapeHtml(dateTimeLocalValue(filters.fromCreatedAt))}" /></label>
      <label class="finance-filter-toolbar__date"><span>تا</span><input name="toCreatedAt" type="datetime-local" value="${escapeHtml(dateTimeLocalValue(filters.toCreatedAt))}" /></label>
      <button type="submit" class="icon-button" aria-label="اعمال فیلتر" title="اعمال فیلتر">${icon('filter_alt')}</button>
      <a data-link class="icon-button" href="/panel/finance?tab=transactions" aria-label="پاک‌کردن فیلتر" title="پاک‌کردن فیلتر">${icon('filter_alt_off')}</a>
    </form>` : '';

    const table = tab === 'transactions'
      ? transactionRows(transactions) + pagination(transactionMeta.number, transactionMeta.totalPages)
      : dataTable<Models.InvoiceUserResponse>([
          { label: 'شناسه فاکتور', render: (row) => invoiceTokenView(row.invoiceToken, `/panel/invoices/${encodeURIComponent(row.invoiceToken ?? '')}`) },
          { label: 'مبلغ', render: (row) => `<b>${money(row.money)}</b>` },
          { label: 'وضعیت', render: (row) => badge(row.status) },
          { label: 'تاریخ ایجاد', render: (row) => faDate(row.createdAt) },
          { label: '', render: (row) => `<a data-link class="button button--ghost button--small" href="/panel/invoices/${encodeURIComponent(row.invoiceToken ?? '')}">جزئیات</a>` },
        ], invoices, { emptyTitle: 'فاکتوری وجود ندارد', emptyText: 'هنوز فاکتوری برای این حساب صادر نشده است.' }) + pagination(invoiceMeta.number, invoiceMeta.totalPages);

    renderAppShell(`${pageHeader('مالی', 'نمای یکپارچه موجودی، گردش حساب و فاکتورهای شما.', [{ label: 'شارژ کیف پول', icon: 'add', id: 'charge-wallet' }])}
      <section class="finance-overview">
        <article class="wallet-balance-card">
          <div class="wallet-balance-card__icon">${icon('account_balance_wallet')}</div>
          <div><small>موجودی قابل استفاده</small><strong>${money(walletOverview.balance)}</strong><span>کیف پول ابر چایی</span></div>
          <button type="button" class="button button--primary button--small" id="charge-wallet-inline">${icon('add')} افزایش موجودی</button>
        </article>
        <div class="finance-metrics">
          <article>${icon('today')}<span><small>هزینه ۲۴ ساعت اخیر</small><b>${money(walletOverview.spentLastDay)}</b></span></article>
          <article>${icon('date_range')}<span><small>هزینه ۷ روز اخیر</small><b>${money(walletOverview.spentLast7days)}</b></span></article>
          <article>${icon('calendar_month')}<span><small>هزینه ۳۰ روز اخیر</small><b>${money(walletOverview.spentLast30days)}</b></span></article>
          <article>${icon('autorenew')}<span><small>پوشش تمدید خودکار</small><b>${walletOverview.autoRenewalCoverageUntil ? remainingTime(walletOverview.autoRenewalCoverageUntil) : 'قابل محاسبه نیست'}</b></span></article>
        </div>
      </section>
      <div class="finance-tabs"><a data-link class="${tab === 'transactions' ? 'active' : ''}" href="/panel/finance?tab=transactions">${icon('sync_alt')} تراکنش‌های کیف پول</a><a data-link class="${tab === 'invoices' ? 'active' : ''}" href="/panel/finance?tab=invoices">${icon('receipt_long')} فاکتورها</a></div>
      ${card(tab === 'transactions' ? 'تراکنش‌های کیف پول' : 'فاکتورهای حساب', table, { icon: tab === 'transactions' ? 'account_balance_wallet' : 'receipt_long', actions: financeFilterToolbar, className: tab === 'transactions' ? 'finance-transactions-card' : '' })}
    `, 'مالی');

    bindInvoiceTokenCopies();
    document.querySelector('#charge-wallet')?.addEventListener('click', openChargeWalletDialog);
    document.querySelector('#charge-wallet-inline')?.addEventListener('click', openChargeWalletDialog);
    document.querySelector<HTMLFormElement>('#finance-filter-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      const values = new FormData(form);
      const query = new URLSearchParams({ tab: 'transactions' });
      const type = String(values.get('transactionType') ?? '');
      const reason = String(values.get('transactionReason') ?? '');
      const from = String(values.get('fromCreatedAt') ?? '');
      const to = String(values.get('toCreatedAt') ?? '');
      if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
        notify('تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.', 'warning');
        return;
      }
      if (type) query.set('transactionType', type);
      if (reason) query.set('transactionReason', reason);
      if (from) query.set('fromCreatedAt', from);
      if (to) query.set('toCreatedAt', to);
      router.navigate(`/panel/finance?${query.toString()}`);
    });
    qsa<HTMLButtonElement>('[data-page]').forEach((button) => button.addEventListener('click', () => {
      const query = new URLSearchParams(location.search);
      query.set('tab', tab);
      query.set('page', String(Number(button.dataset.page)));
      router.navigate(`/panel/finance?${query.toString()}`);
    }));
  } catch (error) {
    renderAppShell(`${pageHeader('مالی', 'کیف پول و فاکتورها')}${errorNotice(error instanceof ApiError ? error.message : undefined)}`, 'مالی');
  }
}

export async function renderWallet(page = 0): Promise<void> {
  renderAppShell(loadingPage(), 'کیف پول');
  try {
    const response = await api.call('getWalletTransactions', { query: { filter: { page, size: 20 } } }); const transactions = contentOf(response); const meta = pageOf(response);
    const credits = transactions.filter((item) => item.type === 'CREDIT').reduce((sum, item) => sum + Number(item.amount?.amount ?? 0), 0);
    const debits = transactions.filter((item) => item.type === 'DEBIT').reduce((sum, item) => sum + Number(item.amount?.amount ?? 0), 0);
    renderAppShell(`${pageHeader('کیف پول', 'شارژ حساب و مشاهده ریز تراکنش‌های مالی.', [{ label: 'شارژ کیف پول', icon: 'add_card', id: 'charge-wallet' }])}
      <div class="stats-grid stats-grid--three">${statCard('واریز در این صفحه', `${faNumber(credits)} تومان`, 'south_west', 'تراکنش‌های بستانکار', 'cyan')}${statCard('برداشت در این صفحه', `${faNumber(debits)} تومان`, 'north_east', 'خرید و تمدید سرویس', 'orange')}${statCard('تعداد تراکنش‌ها', faNumber(meta.totalElements), 'sync_alt', 'کل سوابق ثبت‌شده', 'blue')}</div>
      ${card('تراکنش‌های کیف پول', dataTable<Models.WalletTransactionResponse>([
        { label: 'نوع', render: (row) => badge(row.type) }, { label: 'شرح', render: (row) => `<b>${translateEnum(row.reason)}</b>${row.relatedResourceId ? `<small class="block">سرویس #${faNumber(row.relatedResourceId)}</small>` : ''}` },
        { label: 'مبلغ', render: (row) => `<strong class="money ${row.type === 'CREDIT' ? 'money--credit' : 'money--debit'}">${row.type === 'CREDIT' ? '+' : '−'} ${money(row.amount)}</strong>` }, { label: 'تاریخ', render: (row) => faDate(row.createdAt) }
      ], transactions) + pagination(meta.number, meta.totalPages), { icon: 'account_balance_wallet' })}`, 'کیف پول');
    document.querySelector('#charge-wallet')?.addEventListener('click', openChargeWalletDialog);
    qsa<HTMLButtonElement>('[data-page]').forEach((button) => button.addEventListener('click', () => { const next = Number(button.dataset.page); router.navigate(`/panel/wallet?page=${next}`); }));
  } catch (error) { renderAppShell(`${pageHeader('کیف پول','مدیریت مالی')}${errorNotice(error instanceof ApiError ? error.message : undefined)}`, 'کیف پول'); }
}


export async function renderInvoices(page = 0): Promise<void> {
  renderAppShell(loadingPage(), 'صورت‌حساب‌ها');
  try {
    const status = new URLSearchParams(location.search).get('status') as Models.InvoiceFilterRequest['status'] | null;
    const response = await api.call('getInvoices', { query: { filterRequest: { page, size: 20, status: status ?? undefined } } }); const invoices = contentOf(response); const meta = pageOf(response);
    renderAppShell(`${pageHeader('صورت‌حساب‌ها', 'مشاهده وضعیت، جزئیات و پرداخت فاکتورهای حساب.')}
      <div class="filter-bar"><div class="segmented"><a data-link class="${!status ? 'active' : ''}" href="/panel/invoices">همه</a><a data-link class="${status === 'PENDING' ? 'active' : ''}" href="/panel/invoices?status=PENDING">در انتظار</a><a data-link class="${status === 'PAID' ? 'active' : ''}" href="/panel/invoices?status=PAID">پرداخت‌شده</a><a data-link class="${status === 'CANCELLED' ? 'active' : ''}" href="/panel/invoices?status=CANCELLED">لغوشده</a></div></div>
      ${card('فهرست صورت‌حساب‌ها', dataTable<Models.InvoiceUserResponse>([
        { label: 'شناسه فاکتور', render: (row) => invoiceTokenView(row.invoiceToken, `/panel/invoices/${encodeURIComponent(row.invoiceToken ?? '')}`) }, { label: 'مبلغ', render: (row) => `<b>${money(row.money)}</b>` },
        { label: 'وضعیت', render: (row) => badge(row.status) }, { label: 'تاریخ ایجاد', render: (row) => faDate(row.createdAt) }, { label: 'پرداخت', render: (row) => faDate(row.paidAt) },
        { label: '', render: (row) => `<a data-link class="button button--ghost button--small" href="/panel/invoices/${encodeURIComponent(row.invoiceToken ?? '')}">جزئیات</a>` }
      ], invoices) + pagination(meta.number, meta.totalPages), { icon: 'receipt_long' })}`, 'صورت‌حساب‌ها');
    bindInvoiceTokenCopies();
    qsa<HTMLButtonElement>('[data-page]').forEach((button) => button.addEventListener('click', () => { const next=Number(button.dataset.page); const query=status?`?status=${status}&page=${next}`:`?page=${next}`; router.navigate(`/panel/invoices${query}`); }));
  } catch (error) { renderAppShell(`${pageHeader('صورت‌حساب‌ها','سوابق مالی')}${errorNotice(error instanceof ApiError ? error.message : undefined)}`, 'صورت‌حساب‌ها'); }
}

function showPaymentRedirectResult(invoiceToken: string, result: string | null, amount: Models.Money | undefined): void {
  if (result !== 'true' && result !== 'false') return;
  const current = new URL(location.href);
  current.searchParams.delete('result');
  history.replaceState(history.state, '', `${current.pathname}${current.search}${current.hash}`);
  const paid = result === 'true';
  openDialog({
    title: paid ? 'پرداخت با موفقیت انجام شد' : 'پرداخت ناموفق بود',
    description: paid ? `تأیید پرداخت فاکتور ${invoiceToken}` : `نتیجه پرداخت فاکتور ${invoiceToken}`,
    content: `<div class="payment-redirect-result payment-redirect-result--${paid ? 'success' : 'failed'}">${icon(paid ? 'verified' : 'cancel')}<div><h3>${paid ? `فاکتور شما به مبلغ ${money(amount)} پرداخت شد.` : 'پرداخت فاکتور تکمیل نشد.'}</h3><p>${paid ? 'تراکنش توسط backend تأیید و وضعیت صورت‌حساب به‌روزرسانی شده است.' : 'می‌توانید دوباره یک درگاه را انتخاب کنید یا در صورت کسر وجه با پشتیبانی تماس بگیرید.'}</p>${invoiceTokenView(invoiceToken)}</div></div>`,
    compact: true,
    hideFooter: true,
  });
  bindInvoiceTokenCopies();
}

export async function renderInvoiceDetail(invoiceToken: string): Promise<void> {
  renderAppShell(loadingPage(), 'جزئیات فاکتور');
  try {
    const invoiceResponse = await api.call('getInvoice', { path: { invoiceToken } });
    const raw = objectOf(invoiceResponse);
    const invoice = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as InvoiceDetailDto;
    const gateways = invoice.status === 'PENDING' ? dataOf(await api.call('getAllGateways', {})) ?? [] : [];
    const amount = typeof invoice.amount === 'number' ? { amount: invoice.amount, currency: 'IRT' as const } : invoice.amount ?? invoice.money;
    renderAppShell(`${pageHeader('جزئیات صورت‌حساب', `شناسه: ${invoiceToken}`, [{label:'بازگشت',icon:'arrow_forward',href:'/panel/finance?tab=invoices',variant:'ghost'}])}
      <div class="invoice-layout"><section class="invoice-sheet"><header><div class="brand"><span class="brand__mark">${brandLogo('brand__logo')}</span><span><b>ابر چایی</b><small>TeaCloud</small></span></div>${badge(invoice.status)}</header><div class="invoice-title"><span>صورت‌حساب</span><h2>${escapeHtml(invoice.description || 'خدمات ابر چایی')}</h2></div><dl class="invoice-meta"><div><dt>شناسه</dt><dd>${invoiceTokenView(invoiceToken)}</dd></div><div><dt>تاریخ ایجاد</dt><dd>${faDate(invoice.createdAt)}</dd></div><div><dt>تاریخ پرداخت</dt><dd>${faDate(invoice.paidAt)}</dd></div></dl>${invoice.items?.length ? `<div class="invoice-items">${invoice.items.map((item)=>`<div><span><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.description)}</small></span><strong>${money(item.amount)}</strong></div>`).join('')}</div>` : ''}<footer><span>مبلغ قابل پرداخت</span><strong>${money(amount)}</strong></footer></section>
      <aside>${invoice.status === 'PENDING' ? card('پرداخت آنلاین', `<p class="muted">درگاه پرداخت را انتخاب کنید. پس از دریافت URL از backend به صفحه درگاه منتقل می‌شوید.</p><div class="gateway-list">${gateways.map((gateway) => `<label><input type="radio" name="gateway" value="${gateway.id}"/><span>${icon('account_balance')}<b>${escapeHtml(gateway.name)}</b></span></label>`).join('') || '<p>درگاه فعالی وجود ندارد.</p>'}</div><button id="pay-invoice" class="button button--primary button--block" ${gateways.length ? '' : 'disabled'}>${icon('payments')} پرداخت صورت‌حساب</button>`, {icon:'lock'}) : card('وضعیت پرداخت', `<div class="payment-result">${icon(invoice.status === 'PAID' ? 'verified' : 'cancel')}<h3>${translateEnum(invoice.status)}</h3><p>${invoice.status === 'PAID' ? 'پرداخت این فاکتور با موفقیت ثبت شده است.' : 'این فاکتور قابل پرداخت نیست.'}</p></div>`, {icon:'receipt'})}</aside></div>`, 'جزئیات فاکتور');
    bindInvoiceTokenCopies();
    showPaymentRedirectResult(invoiceToken, new URLSearchParams(location.search).get('result'), amount);
    document.querySelector('#pay-invoice')?.addEventListener('click', async () => {
      const selected = document.querySelector<HTMLInputElement>('input[name="gateway"]:checked'); if (!selected) return notify('یک درگاه پرداخت انتخاب کنید.', 'warning');
      const response = await runAction(() => api.call('payInvoice', { query: { invoiceToken, gatewayId: Number(selected.value) } }), { silentSuccess: true });
      const url = response?.data?.redirectUrl; if (!url) return notify('آدرس انتقال به درگاه در پاسخ backend وجود ندارد.', 'error'); location.assign(url);
    });
  } catch (error) { renderAppShell(`${pageHeader('جزئیات صورت‌حساب','اطلاعات فاکتور')}${errorNotice(error instanceof ApiError ? error.message : undefined)}`, 'جزئیات فاکتور'); }
}

export async function renderTickets(page = 0): Promise<void> {
  renderAppShell(loadingPage(), 'پشتیبانی');
  try {
    const params = new URLSearchParams(location.search); const status = params.get('status') as Models.TicketFilterRequest['status'] | null;
    const response = await api.call('getTickets', { query: { filterRequest: { page, size: 20, status: status ?? undefined } } }); const tickets = contentOf(response); const meta = pageOf(response);
    renderAppShell(`${pageHeader('مرکز پشتیبانی', 'درخواست‌های فنی و فروش را ثبت و پاسخ‌ها را در یک گفت‌وگوی منظم دنبال کنید.', [{label:'تیکت جدید',icon:'add_comment',id:'new-ticket'}])}
      <div class="support-banner"><span>${icon('support_agent')}</span><div><b>تیم ابر چایی کنار شماست</b><p>برای رسیدگی سریع‌تر، سرویس مرتبط و توضیحات دقیق را در تیکت ذکر کنید.</p></div></div>
      <div class="filter-bar"><div class="segmented"><a data-link class="${!status?'active':''}" href="/panel/tickets">همه</a><a data-link class="${status==='PENDING'?'active':''}" href="/panel/tickets?status=PENDING">در انتظار</a><a data-link class="${status==='RESPONDED'?'active':''}" href="/panel/tickets?status=RESPONDED">پاسخ‌داده‌شده</a><a data-link class="${status==='CLOSED'?'active':''}" href="/panel/tickets?status=CLOSED">بسته</a></div></div>
      ${card('تیکت‌های شما', dataTable<Models.TicketListUserResponse>([
        {label:'موضوع',render:(row)=>`<a data-link class="table-primary" href="/panel/tickets/${row.id}">${icon('chat')}<span><b>${escapeHtml(row.subject)}</b><small>تیکت #${faNumber(row.id)}</small></span></a>`},
        {label:'دپارتمان',render:(row)=>translateEnum(row.department)}, {label:'وضعیت',render:(row)=>badge(row.status)}, {label:'ایجاد',render:(row)=>faDate(row.createdAt)}, {label:'آخرین تغییر',render:(row)=>faDate(row.lastModified)},
        {label:'',render:(row)=>`<a data-link class="icon-button" href="/panel/tickets/${row.id}">${icon('chevron_left')}</a>`}
      ], tickets) + pagination(meta.number, meta.totalPages), {icon:'forum'})}`, 'پشتیبانی');
    document.querySelector('#new-ticket')?.addEventListener('click', () => void openNewTicket());
    qsa<HTMLButtonElement>('[data-page]').forEach((button)=>button.addEventListener('click',()=>{const next=Number(button.dataset.page); const q=status?`?status=${status}&page=${next}`:`?page=${next}`;router.navigate(`/panel/tickets${q}`);}));
  } catch (error) { renderAppShell(`${pageHeader('مرکز پشتیبانی','مدیریت تیکت‌ها')}${errorNotice(error instanceof ApiError ? error.message : undefined)}`, 'پشتیبانی'); }
}

async function openNewTicket(): Promise<void> {
  const resources = dataOf(await api.call('getResources', {})) ?? []; const related = new URLSearchParams(location.search).get('resource') ?? '';
  const form = document.createElement('form'); form.className='form-grid'; form.innerHTML=`${field('subject','موضوع تیکت',{required:true})}${selectField('department','دپارتمان',[{value:'TECHNICAL',label:'پشتیبانی فنی'},{value:'SALES',label:'فروش'}],'TECHNICAL',true)}${selectField('relatedResourceId','سرویس مرتبط',[{value:'',label:'بدون سرویس مرتبط'},...resources.map(r=>({value:r.id??'',label:r.label||r.productName||`#${r.id}`}))],related)}${textarea('message','توضیحات', '', true)}<label class="field field--full"><span>پیوست‌ها</span><input type="file" name="files" multiple/><small>فایل‌های انتخاب‌شده را قبل از ارسال می‌توانید حذف کنید.</small></label><div class="ticket-selected-files ticket-selected-files--form field--full" data-file-list hidden></div>`;
  const ticketFiles = bindFileSelection(qs<HTMLInputElement>('input[type="file"]', form), qs<HTMLElement>('[data-file-list]', form));
  openDialog({title:'ثبت تیکت جدید',description:'پیام backend پس از ثبت مستقیماً نمایش داده می‌شود.',content:form,confirmLabel:'ارسال تیکت',wide:true,onConfirm:async()=>{
    if(!form.reportValidity())return false; const values=new FormData(form); const ticket={subject:String(values.get('subject')??''),department:String(values.get('department')??'TECHNICAL'),relatedResourceId:values.get('relatedResourceId')?Number(values.get('relatedResourceId')):undefined,message:{content:String(values.get('message')??'')}};
    const body=new FormData(); body.append('ticket',new Blob([JSON.stringify(ticket)],{type:'application/json'})); ticketFiles.files().forEach(file=>body.append('files',file));
    const response=await runAction(()=>api.call('submitTicket',{body})); if(!response)return false; await renderTickets(); return true;
  }});
}

export async function renderTicketDetail(ticketId: number): Promise<void> {
  renderAppShell(loadingPage(), 'گفت‌وگوی پشتیبانی');
  try {
    const response = await api.call('getTicketDetails', { path: { id: ticketId } });
    const ticket = dataOf(response);
    if (!ticket) throw new Error('جزئیات تیکت دریافت نشد.');

    const open = ticket.status !== 'CLOSED';
    const messages = (ticket.messages ?? []).map((message) => renderTicketMessage(message, 'customer')).join('');
    renderAppShell(`${pageHeader(
      ticket.subject || `تیکت #${ticketId}`,
      `${translateEnum(ticket.department)} — ایجاد ${faDate(ticket.createdAt)}`,
      [
        { label: 'بازگشت', icon: 'arrow_forward', href: '/panel/tickets', variant: 'ghost' },
        ...(open ? [{ label: 'بستن تیکت', icon: 'close', id: 'close-ticket', variant: 'danger' as const }] : []),
      ],
    )}
      <div class="ticket-layout">
        <section class="ticket-thread">
          <header><div><span>تیکت #${faNumber(ticket.id)}</span>${badge(ticket.status)}</div><small>آخرین تغییر: ${faDate(ticket.lastModified)}</small></header>
          <div class="messages">${messages}</div>
          ${open ? `<form id="ticket-reply" class="reply-box">
            <textarea name="content" placeholder="پاسخ خود را بنویسید…" required></textarea>
            <div class="ticket-selected-files" data-file-list hidden></div>
            <div class="reply-box__actions"><button class="button button--primary">ارسال پاسخ ${icon('send')}</button><label class="icon-button file-button" title="افزودن پیوست">${icon('attach_file')}<input type="file" name="files" multiple hidden/></label></div>
          </form>` : `<div class="notice notice--neutral">${icon('lock')} این تیکت بسته شده و امکان ارسال پیام جدید وجود ندارد.</div>`}
        </section>
        <aside>${card('اطلاعات درخواست', `<dl class="description-list"><div><dt>دپارتمان</dt><dd>${translateEnum(ticket.department)}</dd></div><div><dt>وضعیت</dt><dd>${badge(ticket.status)}</dd></div><div><dt>سرویس مرتبط</dt><dd>${escapeHtml(ticket.serviceName || '—')}</dd></div><div><dt>تعداد پیام‌ها</dt><dd>${faNumber(ticket.messages?.length)}</dd></div></dl>`, { icon: 'info' })}</aside>
      </div>`, 'گفت‌وگوی پشتیبانی');

    document.querySelector('#close-ticket')?.addEventListener('click', () => {
      confirmDialog(
        'بستن تیکت',
        'پس از بستن تیکت امکان ارسال پیام جدید وجود نخواهد داشت. از انجام این کار مطمئن هستید؟',
        'بستن تیکت',
        async () => {
          if (await runAction(() => api.call('closeTicket', { path: { ticketId } }))) {
            await renderTicketDetail(ticketId);
          }
        },
        true,
      );
    });

    const replyForm = document.querySelector<HTMLFormElement>('#ticket-reply');
    if (replyForm) {
      const fileSelection = bindFileSelection(
        qs<HTMLInputElement>('input[type="file"]', replyForm),
        qs<HTMLElement>('[data-file-list]', replyForm),
      );
      replyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!replyForm.reportValidity()) return;
        const data = new FormData(replyForm);
        const body = new FormData();
        body.append('content', String(data.get('content') ?? ''));
        fileSelection.files().forEach((file) => body.append('files', file));
        if (await runAction(() => api.call('addTicketMessage', { path: { ticketId }, body }))) {
          await renderTicketDetail(ticketId);
        }
      });
    }

    qsa<HTMLButtonElement>('[data-attachment]').forEach((button) => button.addEventListener('click', async () => {
      const identifier = button.dataset.attachment ?? '';
      try {
        const blob = await api.call('getAttachment', { path: { identifier } });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = button.dataset.filename || 'attachment';
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        notify(error instanceof ApiError ? error.message : 'دانلود فایل انجام نشد.', 'error');
      }
    }));
  } catch (error) {
    renderAppShell(`${pageHeader('گفت‌وگوی پشتیبانی', 'جزئیات تیکت')}${errorNotice(error instanceof ApiError ? error.message : undefined)}`, 'گفت‌وگوی پشتیبانی');
  }
}

export async function renderNotifications(): Promise<void> {
  renderAppShell(loadingPage(), 'اعلان‌ها');
  try { const response=await api.call('getAllGlobalNotifications_1',{}); const notifications=dataOf(response)??[]; renderAppShell(`${pageHeader('اعلان‌های سامانه','آخرین اطلاعیه‌ها و پیام‌های عمومی ابر چایی.')}${card('همه اعلان‌ها',notifications.length?`<div class="notification-timeline">${notifications.map(item=>`<article><span>${icon('campaign')}</span><div><header><h3>${escapeHtml(item.title)}</h3><time>${faDate(item.createdAt)}</time></header><p>${escapeHtml(item.text).replaceAll('\n','<br/>')}</p></div></article>`).join('')}</div>`:emptyState('اعلان جدیدی وجود ندارد','اطلاعیه‌های عمومی در این صفحه نمایش داده می‌شوند.'),{icon:'notifications'})}`,'اعلان‌ها'); }
  catch(error){renderAppShell(`${pageHeader('اعلان‌ها','اطلاعیه‌های سامانه')}${errorNotice(error instanceof ApiError?error.message:undefined)}`,'اعلان‌ها');}
}

export async function renderAccount(): Promise<void> {
  renderAppShell(loadingPage(), 'حساب کاربری');
  try { const response=await api.call('getProfile',{}); const profile=dataOf(response); if(!profile)throw new Error('پروفایل دریافت نشد.'); renderAppShell(`${pageHeader('حساب کاربری','اطلاعات هویتی و وضعیت حساب شما.')}
    <div class="profile-grid"><section class="profile-card"><div class="profile-cover"></div><div class="profile-avatar">${icon('person')}</div><h2>${escapeHtml(`${profile.firstName??''} ${profile.lastName??''}`.trim()||'کاربر ابر چایی')}</h2><p dir="ltr">${escapeHtml(profile.phone)}</p>${badge(profile.role)}<div class="profile-stats"><div><span>عضویت</span><b>${faDateShort(profile.createdAt)}</b></div><div><span>آخرین ورود</span><b>${faDateShort(profile.lastLogin)}</b></div></div></section>
    ${card('اطلاعات حساب',`<div class="form-grid readonly-form">${field('firstName','نام',{value:profile.firstName})}${field('lastName','نام خانوادگی',{value:profile.lastName})}${field('phone','شماره موبایل',{value:profile.phone,dir:'ltr'})}${field('email','ایمیل',{value:profile.email,dir:'ltr'})}</div><div class="account-status"><div>${icon(profile.emailVerified?'verified':'mark_email_unread')}<span><b>وضعیت ایمیل</b><small>${profile.emailVerified?'ایمیل تأیید شده است':'ایمیل هنوز تأیید نشده است'}</small></span>${badge(profile.emailVerified?'ACTIVE':'PENDING')}</div><div>${icon('security')}<span><b>سطح دسترسی</b><small>بر اساس هویت دریافت‌شده از backend</small></span><strong>${escapeHtml(translateEnum(profile.role))}</strong></div></div>`,{icon:'manage_accounts'})}</div>`,'حساب کاربری'); qsa<HTMLInputElement>('.readonly-form input').forEach(input=>input.readOnly=true); }
  catch(error){renderAppShell(`${pageHeader('حساب کاربری','اطلاعات پروفایل')}${errorNotice(error instanceof ApiError?error.message:undefined)}`,'حساب کاربری');}
}
