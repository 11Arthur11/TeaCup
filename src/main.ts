import { fetchSessionProfile } from './api/session-profile.js';
import { hasActiveAuthSession } from './api/auth-session.js';
import { primeProductCategoryNavigation } from './api/catalog.js';
import { ApiError, setForbiddenHandler, setNetworkFailureHandler } from './api/client.js';
import { canAccessAdminArea, hasAdminPanelAccess, type AdminArea } from './core/authorization.js';
import { openDialog } from './core/dialog.js';
import { appRoot, escapeHtml, icon } from './core/dom.js';
import { router, type RouteContext, type RouteHandler } from './core/router.js';
import { pageRefresh } from './core/page-refresh.js';
import { beginRouteLoading, finishRouteLoading } from './core/route-loading.js';
import { store } from './core/store.js';
import { notify } from './core/toast.js';
import { renderAppShell, renderPublic } from './ui/layout.js';
import { renderAuth } from './pages/auth.js';
import { renderLanding, renderPublicProducts, renderRules } from './pages/landing.js';
import {
  renderAccount, renderFinance, renderInvoiceDetail, renderNotifications, renderProducts, renderServiceDetail,
  renderServices, renderTicketDetail, renderTickets, renderUserDashboard
} from './pages/user.js';
import {
  renderAdminCategories, renderAdminDashboard, renderAdminDns, renderAdminGateways, renderAdminInvoiceDetail, renderAdminInvoices, renderAdminLiaraDns,
  renderAdminNotifications, renderAdminResourceDetail, renderAdminResources, renderAdminLiveStatus, renderAdminTicketDetail,
  renderAdminTickets, renderAdminUserDetail, renderAdminUsers, renderAdminProducts, renderAudioNodeDetail, renderAudioNodes,
  renderQueryInstanceDetail, renderQueryInstances
} from './pages/admin.js';


let maintenanceDialogOpen = false;

function showBackendUnavailableDialog(): void {
  if (maintenanceDialogOpen) return;
  maintenanceDialogOpen = true;
  pageRefresh.stop();
  const dialog = openDialog({
    title: 'داشبورد موقتاً در دسترس نیست',
    description: 'ارتباط با سرور برقرار نشد. برای جلوگیری از نمایش اطلاعات ناقص، دسترسی به پنل تا برقراری دوباره ارتباط متوقف شده است.',
    content: `<div class="maintenance-dialog__content">${icon('cloud_off')}<p>به صفحه اصلی منتقل می‌شوید. وضعیت نگهداری و امکان بررسی مجدد در همان صفحه نمایش داده می‌شود.</p><button type="button" class="button button--primary" data-maintenance-landing>بازگشت به صفحه اصلی</button></div>`,
    compact: true,
    hideFooter: true,
  });
  const goLanding = (): void => {
    maintenanceDialogOpen = false;
    if (location.pathname !== '/') router.navigate('/', true);
  };
  dialog.querySelector<HTMLButtonElement>('[data-maintenance-landing]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', goLanding, { once: true });
}

setNetworkFailureHandler(() => {
  if (location.pathname.startsWith('/panel') || location.pathname.startsWith('/admin')) {
    showBackendUnavailableDialog();
  }
});

type IdentityResolution =
  | { kind: 'ready' }
  | { kind: 'guest' }
  | { kind: 'error'; error: unknown };

let redirectingAfterForbidden = false;
setForbiddenHandler(() => {
  if (redirectingAfterForbidden) return;
  redirectingAfterForbidden = true;
  store.setIdentity({ status: 'guest', userId: null, role: null });

  const current = `${location.pathname}${location.search}`;
  const isProtectedLocation = location.pathname.startsWith('/panel') || location.pathname.startsWith('/admin');
  const target = isProtectedLocation
    ? `/auth?reason=session-ended&next=${encodeURIComponent(current)}`
    : '/auth?reason=session-ended';

  // A full replace prevents an in-flight page handler from rendering protected content after the 403.
  location.replace(target);
});

/**
 * Session validity is checked exclusively through HEAD /v1/auth/session.
 * The profile endpoint is requested only after the backend confirms an active session.
 */
async function ensureIdentity(): Promise<IdentityResolution> {
  try {
    const sessionActive = await hasActiveAuthSession();
    if (!sessionActive) {
      store.setIdentity({ status: 'guest', userId: null, role: null });
      return { kind: 'guest' };
    }

    if (store.get().identity.status === 'authenticated') return { kind: 'ready' };

    store.setIdentity({ status: 'checking', userId: null, role: null });
    store.setIdentity(await fetchSessionProfile());
    void primeProductCategoryNavigation().catch(() => undefined);
    return { kind: 'ready' };
  } catch (error) {
    if (store.get().identity.status === 'guest') return { kind: 'guest' };
    return { kind: 'error', error };
  }
}

async function renderAuthRoute(context: RouteContext): Promise<void> {
  const resolution = await ensureIdentity();
  if (resolution.kind === 'ready') {
    router.navigate(hasAdminPanelAccess(store.get().identity.role) ? '/admin' : '/panel', true);
    return;
  }
  if (resolution.kind === 'error') {
    renderIdentityUnavailable(resolution.error);
    return;
  }

  renderAuth();
  if (context.query.get('reason') === 'session-ended') {
    const next = context.query.get('next');
    history.replaceState({}, '', next ? `/auth?next=${encodeURIComponent(next)}` : '/auth');
    notify('نشست شما پایان یافته است. دوباره وارد حساب شوید.', 'warning');
  }
}

const authenticated = (handler: RouteHandler): RouteHandler => async (context) => {
  const resolution = await ensureIdentity();
  if (resolution.kind === 'guest') {
    router.navigate(`/auth?next=${encodeURIComponent(context.path)}`, true);
    return;
  }
  if (resolution.kind === 'error') {
    renderIdentityUnavailable(resolution.error);
    return;
  }
  await handler(context);
};

const adminArea = (area: AdminArea, handler: RouteHandler): RouteHandler => authenticated(async (context) => {
  if (!canAccessAdminArea(store.get().identity.role, area)) {
    renderForbidden();
    return;
  }
  await handler(context);
});


const refreshed = (handler: RouteHandler): RouteHandler => async (context) => {
  const query = context.query.toString();
  const routeKey = `${context.path}${query ? `?${query}` : ''}`;
  await pageRefresh.start(routeKey, () => handler(context));
};

const liveAuthenticated = (handler: RouteHandler): RouteHandler => authenticated(refreshed(handler));
const liveAdminArea = (area: AdminArea, handler: RouteHandler): RouteHandler => adminArea(area, refreshed(handler));

function numberParam(context: RouteContext, key: string): number {
  const value = Number(context.params[key]);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('شناسه مسیر معتبر نیست.');
  return value;
}

function renderIdentityUnavailable(error: unknown): void {
  if (error instanceof ApiError && error.status === 0) {
    showBackendUnavailableDialog();
    return;
  }
  const message = error instanceof ApiError ? error.message : 'دریافت اطلاعات دسترسی با خطا مواجه شد.';
  renderPublic(`<section class="error-page"><span>${icon('cloud_off')}</span><h1>پروفایل و سطح دسترسی دریافت نشد</h1><p>${escapeHtml(message)}</p><button class="button button--primary" onclick="location.reload()">تلاش دوباره</button></section>`);
}

function renderForbidden(): void {
  const hasStaffAccess = hasAdminPanelAccess(store.get().identity.role);
  const backHref = hasStaffAccess ? '/admin' : '/panel';
  const backLabel = hasStaffAccess ? 'بازگشت به پنل مدیریت' : 'بازگشت به پنل کاربری';
  renderAppShell(`<section class="error-page"><span>${icon('gpp_bad')}</span><h1>دسترسی مجاز نیست</h1><p>نقش فعلی شما اجازه مشاهده یا مدیریت این بخش را ندارد.</p><a data-link class="button button--primary" href="${backHref}">${backLabel}</a></section>`, 'دسترسی محدود');
}
function renderNotFound(): void {
  renderPublic(`<section class="error-page"><span>${icon('travel_explore')}</span><h1>صفحه پیدا نشد</h1><p>آدرس واردشده وجود ندارد یا جابه‌جا شده است.</p><a data-link class="button button--primary" href="/">بازگشت به خانه</a></section>`);
}
function renderFatal(error: unknown): void {
  appRoot().innerHTML = `<section class="error-page"><span>${icon('error')}</span><h1>خطای برنامه</h1><p>${escapeHtml(error instanceof Error ? error.message : 'خطای پیش‌بینی‌نشده رخ داد.')}</p><button class="button button--primary" onclick="location.reload()">بارگذاری دوباره</button></section>`;
}

router
  .setBeforeResolve(() => { store.set({ sidebarOpen: false }); document.querySelector('.app-shell')?.classList.remove('app-shell--sidebar-open'); pageRefresh.stop(); beginRouteLoading(); })
  .setAfterResolve(() => finishRouteLoading())
  .register('/', () => renderLanding())
  .register('/products', () => renderPublicProducts())
  .register('/rules', () => renderRules())
  .register('/auth', (ctx) => renderAuthRoute(ctx))
  .register('/panel', authenticated(() => renderUserDashboard()))
  .register('/panel/services', liveAuthenticated(() => renderServices()))
  .register('/panel/services/:id', liveAuthenticated((ctx) => renderServiceDetail(numberParam(ctx, 'id'))))
  .register('/panel/products', liveAuthenticated(() => renderProducts()))
  .register('/panel/products/:slug', liveAuthenticated((ctx) => renderProducts(ctx.params.slug ?? '')))
  .register('/panel/finance', liveAuthenticated((ctx) => renderFinance(Number(ctx.query.get('page') ?? 0), ctx.query.get('tab') === 'invoices' ? 'invoices' : 'transactions')))
  .register('/panel/wallet', authenticated(() => { router.navigate('/panel/finance?tab=transactions', true); }))
  .register('/panel/invoices', authenticated(() => { router.navigate('/panel/finance?tab=invoices', true); }))
  .register('/panel/invoices/:token', liveAuthenticated((ctx) => renderInvoiceDetail(ctx.params.token ?? '')))
  .register('/panel/tickets', liveAuthenticated((ctx) => renderTickets(Number(ctx.query.get('page') ?? 0))))
  .register('/panel/tickets/:id', liveAuthenticated((ctx) => renderTicketDetail(numberParam(ctx, 'id'))))
  .register('/panel/notifications', liveAuthenticated(() => renderNotifications()))
  .register('/panel/account', liveAuthenticated(() => renderAccount()))
  .register('/admin', adminArea('dashboard', () => renderAdminDashboard()))
  .register('/admin/users', liveAdminArea('users', (ctx) => renderAdminUsers(Number(ctx.query.get('page') ?? 0))))
  .register('/admin/users/:id', liveAdminArea('users', (ctx) => renderAdminUserDetail(numberParam(ctx, 'id'))))
  .register('/admin/resources', liveAdminArea('resources', (ctx) => renderAdminResources(Number(ctx.query.get('page') ?? 0))))
  .register('/admin/resources/:id', liveAdminArea('resources', (ctx) => renderAdminResourceDetail(numberParam(ctx, 'id'))))
  .register('/admin/products', liveAdminArea('products', () => renderAdminProducts()))
  .register('/admin/categories', liveAdminArea('categories', () => renderAdminCategories()))
  .register('/admin/tickets', liveAdminArea('tickets', (ctx) => renderAdminTickets(Number(ctx.query.get('page') ?? 0))))
  .register('/admin/tickets/:id', liveAdminArea('tickets', (ctx) => renderAdminTicketDetail(numberParam(ctx, 'id'))))
  .register('/admin/invoices', liveAdminArea('invoices', (ctx) => renderAdminInvoices(Number(ctx.query.get('page') ?? 0))))
  .register('/admin/invoices/:token', liveAdminArea('invoices', (ctx) => renderAdminInvoiceDetail(ctx.params.token ?? '')))
  .register('/admin/gateways', liveAdminArea('gateways', () => renderAdminGateways()))
  .register('/admin/query-instances', liveAdminArea('queryInstances', () => renderQueryInstances()))
  .register('/admin/query-instances/:id', liveAdminArea('queryInstances', (ctx) => renderQueryInstanceDetail(numberParam(ctx, 'id'))))
  .register('/admin/audio-nodes', liveAdminArea('audioNodes', () => renderAudioNodes()))
  .register('/admin/audio-nodes/:id', liveAdminArea('audioNodes', (ctx) => renderAudioNodeDetail(numberParam(ctx, 'id'))))
  .register('/admin/notifications', liveAdminArea('notifications', () => renderAdminNotifications()))
  .register('/admin/dns', adminArea('dns', () => renderAdminDns()))
  .register('/admin/dns/liara', liveAdminArea('dns', () => renderAdminLiaraDns()))
  .register('/admin/monitoring', liveAdminArea('liveStatus', () => renderAdminLiveStatus()))
  .register('/admin/profile', liveAdminArea('profile', () => renderAccount()))
  .register('/admin/live-status', adminArea('liveStatus', () => { router.navigate('/admin/monitoring', true); }))
  .setFallback(() => renderNotFound());

window.addEventListener('unhandledrejection', (event) => {
  console.error(event.reason);
  if (event.reason instanceof Error) notify(event.reason.message, 'error');
});
window.addEventListener('error', (event) => console.error(event.error));

try { router.start(); } catch (error) { renderFatal(error); }
