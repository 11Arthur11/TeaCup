import { api, apiBaseUrl } from '../api/client.js';
import { canAccessAdminArea, hasAdminPanelAccess, roleLabel, type AdminArea } from '../core/authorization.js';
import { runAction } from '../core/action.js';
import { getBackendAvailability, probeBackendAvailability, subscribeBackendAvailability } from '../core/backend-availability.js';
import { openDialog } from '../core/dialog.js';
import { appRoot, bellIcon, brandLogo, escapeHtml, icon, qsa } from '../core/dom.js';
import { hasPendingPageInteraction, isBackgroundPageRefresh } from '../core/page-refresh.js';
import { router } from '../core/router.js';
import { store } from '../core/store.js';
import { userChrome } from '../core/user-chrome.js';
import { openChargeWalletDialog } from '../core/wallet-action.js';
import { initializeTheme, themeToggleButton } from '../core/theme.js';
import { getUserProfileSnapshot, invalidateUserProfile } from '../api/user-profile.js';
import { bindDashboardTourGuide } from './dashboard-tour.js';

interface NavItem { label: string; href: string; icon: string; area?: AdminArea; }

let publicShellController: AbortController | undefined;

const userNav: NavItem[] = [
  { label: 'داشبورد نمای کلی', href: '/panel', icon: 'dashboard' },
  { label: 'سرویس‌های من', href: '/panel/services', icon: 'dns' },
  { label: 'DNS های من', href: '/panel/dns', icon: 'language' },
  { label: 'محصولات', href: '/panel/products', icon: 'shopping_bag' },
  { label: 'مالی', href: '/panel/finance', icon: 'account_balance_wallet' },
  { label: 'پشتیبانی', href: '/panel/tickets', icon: 'support_agent' },
  { label: 'پروفایل', href: '/panel/account', icon: 'manage_accounts' },
];

const adminNav: NavItem[] = [
  { label: 'نمای کلی', href: '/admin', icon: 'space_dashboard', area: 'dashboard' },
  { label: 'کاربران', href: '/admin/users', icon: 'group', area: 'users' },
  { label: 'دسته‌بندی‌ها', href: '/admin/categories', icon: 'category', area: 'categories' },
  { label: 'محصولات', href: '/admin/products', icon: 'inventory_2', area: 'products' },
  { label: 'سرویس‌های کاربران', href: '/admin/resources', icon: 'cloud_queue', area: 'resources' },
  { label: 'تیکت‌ها', href: '/admin/tickets', icon: 'forum', area: 'tickets' },
  { label: 'فاکتورها', href: '/admin/invoices', icon: 'request_quote', area: 'invoices' },
  { label: 'درگاه‌های پرداخت', href: '/admin/gateways', icon: 'payments', area: 'gateways' },
  { label: 'نودهای Query', href: '/admin/query-instances', icon: 'lan', area: 'queryInstances' },
  { label: 'نودهای ربات موزیک', href: '/admin/audio-nodes', icon: 'headphones', area: 'audioNodes' },
  { label: 'اعلان‌های عمومی', href: '/admin/notifications', icon: 'campaign', area: 'notifications' },
  { label: 'تنظیمات DNS', href: '/admin/dns', icon: 'language', area: 'dns' },
  { label: 'سیستم', href: '/admin/system', icon: 'settings_suggest', area: 'liveStatus' },
  { label: 'پروفایل', href: '/admin/profile', icon: 'manage_accounts', area: 'profile' },
];

function isActive(href: string, current: string): boolean {
  return href === current || (href !== '/panel' && href !== '/admin' && current.startsWith(`${href}/`));
}

function navItemHtml(item: NavItem, current: string, tourIndex?: number): string {
  const tourAttribute = tourIndex ? ` data-tour-menu-index="${tourIndex}"` : '';
  return `<a data-link class="nav-item ${isActive(item.href, current) ? 'nav-item--active' : ''}" href="${item.href}"${tourAttribute}>${icon(item.icon)}<span>${escapeHtml(item.label)}</span></a>`;
}

function userNavHtml(current: string): string {
  return userNav.map((item, index) => {
    const base = navItemHtml(item, current, index + 1);
    if (item.href !== '/panel/products') return base;
    const categories = store.get().productCategories;
    const isOpen = store.get().productSubtreeOpen;
    const subtree = categories.length
      ? categories.map((category) => {
          const href = `/panel/products/${encodeURIComponent(category.slug)}`;
          return `<a data-link class="nav-subitem ${isActive(href, current) ? 'nav-subitem--active' : ''}" href="${href}"><i></i><span>${escapeHtml(category.name)}</span></a>`;
        }).join('')
      : '<span class="nav-subtree__empty">دسته فعالی وجود ندارد</span>';
    return `<div class="nav-group ${isOpen ? 'nav-group--open' : ''}"><div class="nav-group__row">${base}<button type="button" class="nav-subtree-toggle" data-product-subtree-toggle aria-expanded="${isOpen}" aria-label="${isOpen ? 'بستن دسته‌های محصولات' : 'نمایش دسته‌های محصولات'}">${icon(isOpen ? 'expand_less' : 'expand_more')}</button></div><div class="nav-subtree" ${isOpen ? '' : 'hidden'}>${subtree}</div></div>`;
  }).join('');
}

function adminNavHtml(current: string): string {
  return adminNav
    .filter((item) => item.area && canAccessAdminArea(store.get().identity.role, item.area))
    .map((item) => navItemHtml(item, current))
    .join('');
}

function showPublicMaintenanceDialog(): void {
  if (document.querySelector('dialog[data-maintenance-dialog]')) return;
  const dialog = openDialog({
    title: 'سامانه موقتاً در دسترس نیست',
    description: 'ارتباط با سرور برقرار نشد و دسترسی به داشبورد تا بازگشت سرویس متوقف شده است.',
    content: `<div class="maintenance-dialog__content">${icon('engineering')}<p>ممکن است عملیات نگهداری یا اختلال شبکه در جریان باشد. چند لحظه دیگر دوباره وضعیت را بررسی کنید.</p><button type="button" class="button button--primary" data-maintenance-retry>${icon('refresh')} بررسی دوباره</button></div>`,
    compact: true,
    hideFooter: true,
  });
  dialog.dataset.maintenanceDialog = 'true';
  dialog.querySelector<HTMLButtonElement>('[data-maintenance-retry]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    button.disabled = true;
    button.dataset.loading = 'true';
    await probeBackendAvailability(apiBaseUrl);
    syncBackendAvailabilityUi();
    button.disabled = false;
    delete button.dataset.loading;
    if (getBackendAvailability() === 'available') dialog.close();
  });
}

export function syncBackendAvailabilityUi(): void {
  const unavailable = getBackendAvailability() === 'unavailable';
  document.querySelector<HTMLElement>('[data-maintenance-banner]')?.toggleAttribute('hidden', !unavailable);
  qsa<HTMLElement>('[data-dashboard-access]').forEach((node) => {
    node.classList.toggle('dashboard-access--disabled', unavailable);
    node.setAttribute('aria-disabled', String(unavailable));
  });
}

function bindPublicShell(): void {
  publicShellController?.abort();
  const controller = new AbortController();
  publicShellController = controller;
  const signal = controller.signal;
  const publicHeader = document.querySelector<HTMLElement>('[data-public-header]');
  let frame = 0;
  const syncHeader = (): void => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      publicHeader?.classList.toggle('public-header-wrap--scrolled', window.scrollY > 24);
    });
  };
  window.addEventListener('scroll', syncHeader, { passive: true, signal });
  syncHeader();

  qsa<HTMLElement>('[data-dashboard-access]').forEach((node) => node.addEventListener('click', (event) => {
    if (getBackendAvailability() !== 'unavailable') return;
    event.preventDefault();
    event.stopPropagation();
    showPublicMaintenanceDialog();
  }, { signal }));
  document.querySelector<HTMLButtonElement>('[data-maintenance-retry]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    button.disabled = true;
    await probeBackendAvailability(apiBaseUrl);
    button.disabled = false;
    syncBackendAvailabilityUi();
  }, { signal });
  syncBackendAvailabilityUi();
}

export function renderPublic(content: string, options: { transparent?: boolean } = {}): void {
  document.documentElement.classList.remove('landing-loader-lock');
  userChrome.stop();
  const root = appRoot();
  root.innerHTML = `<div class="public-shell ${options.transparent ? 'public-shell--transparent' : ''}">
    <div class="public-header-wrap" data-public-header><header class="public-header"><a data-link href="/" class="brand"><span class="brand__mark">${brandLogo('brand__logo')}</span><span><b>ابر چایی</b><small>TeaCloud</small></span></a>
    <nav><a data-link href="/products">محصولات</a><a data-link href="/#features">امکانات</a><a data-link href="/rules">قوانین</a></nav>
    <div class="public-header__actions">${themeToggleButton('icon-button public-theme-toggle')}<a data-link data-dashboard-access class="button button--primary" href="/auth">ورود به پنل</a></div></header></div>
    <section class="maintenance-banner" data-maintenance-banner hidden>${icon('engineering')}<div><b>سامانه موقتاً در حالت نگهداری است</b><span>ارتباط با سامانه برقرار نیست و ورود به داشبورد تا بازگشت سرویس غیرفعال شده است.</span></div><button type="button" class="button button--ghost button--small" data-maintenance-retry>${icon('refresh')} بررسی دوباره</button></section>
    <main>${content}</main><footer class="public-footer"><div class="brand"><span class="brand__mark">${brandLogo('brand__logo')}</span><span><b>ابر چایی</b><small>TeaCloud</small></span></div><p>خرید و مدیریت سرویس‌های صوتی، ساده و مطمئن.</p><span>© ۱۴۰۵ ابر چایی</span></footer></div>`;
  initializeTheme();
  bindPublicShell();
}

export function renderAppShell(content: string, title = ''): void {
  document.documentElement.classList.remove('landing-loader-lock');
  if (isBackgroundPageRefresh() && (content.includes('class="skeleton-page"') || hasPendingPageInteraction())) return;
  const state = store.get();
  const current = location.pathname;
  const isAdminSection = current.startsWith('/admin');
  const isSupport = state.identity.role === 'ROLE_SUPPORT';
  const panelTitle = isAdminSection ? (isSupport ? 'پنل پشتیبانی' : 'پنل مدیریت') : 'پنل کاربری';
  const switchHref = isAdminSection ? '/panel' : '/admin';
  const switchLabel = isAdminSection ? 'پنل کاربری' : (isSupport ? 'پنل پشتیبانی' : 'پنل مدیریت');
  const switchIcon = isAdminSection ? 'person' : (isSupport ? 'support_agent' : 'admin_panel_settings');
  const nav = isAdminSection ? adminNavHtml(current) : userNavHtml(current);
  const profile = !isAdminSection ? getUserProfileSnapshot() : undefined;
  const profileName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() || 'کاربر ابر چایی';
  const sidebarUserTitle = isAdminSection ? panelTitle : profileName;
  const sidebarUserSubtitle = isAdminSection ? roleLabel(state.identity.role) : (profile?.phone || roleLabel(state.identity.role));
  const root = appRoot();

  root.innerHTML = `<div class="app-shell ${state.sidebarOpen ? 'app-shell--sidebar-open' : ''}">
    <div class="sidebar-backdrop" data-sidebar-close></div>
    <aside class="sidebar">
      <div class="sidebar__top"><a data-link href="${isAdminSection ? '/admin' : '/panel'}" class="brand brand--sidebar"><span class="brand__mark">${brandLogo('brand__logo')}</span><span><b>ابر چایی</b><small>TeaCloud</small></span></a><button type="button" class="icon-button sidebar__mobile-close" data-sidebar-close>${icon('close')}</button></div>
      <div class="sidebar__scroll"><span class="nav-label">${panelTitle}</span><nav>${nav}</nav></div>
      ${!isAdminSection ? `<div class="sidebar-guide-wrap"><button type="button" class="sidebar-guide" data-dashboard-tour-start hidden>${icon('help')}<span data-dashboard-tour-guide-label></span></button></div>` : ''}
      <div class="sidebar__footer"><div class="sidebar-user"><span class="avatar">${icon(isAdminSection ? switchIcon : 'person')}</span><div><b title="${escapeHtml(sidebarUserTitle)}">${escapeHtml(sidebarUserTitle)}</b><small ${!isAdminSection && profile?.phone ? 'dir="ltr"' : ''} title="${escapeHtml(sidebarUserSubtitle)}">${escapeHtml(sidebarUserSubtitle)}</small></div></div><button type="button" class="icon-button" data-logout title="خروج">${icon('logout')}</button></div>
    </aside>
    <section class="workspace"><header class="topbar"><div><button type="button" class="icon-button topbar__menu" data-sidebar-open>${icon('menu')}</button><div class="topbar__title"><small>${panelTitle}</small><b>${escapeHtml(title || 'ابر چایی')}</b></div></div><div class="topbar__actions">
      ${!isAdminSection ? `<div class="topbar-wallet" data-tour-target="HEADER_WALLET"><span><small>موجودی</small><b data-user-wallet-balance>۰ تومان</b></span><button type="button" class="topbar-wallet__add" data-charge-wallet-header aria-label="شارژ کیف پول" title="شارژ کیف پول">${icon('add')}</button></div><button type="button" class="icon-button topbar-notification" data-user-notifications-open aria-label="اعلان‌های عمومی" title="اعلان‌های عمومی">${bellIcon('topbar-notification__icon')}<span class="topbar-notification__count" data-user-notification-count>۰</span></button>` : ''}
      ${hasAdminPanelAccess(state.identity.role) ? `<a data-link href="${switchHref}" class="button button--secondary button--small panel-switch">${icon(switchIcon)} ${switchLabel}</a>` : ''}
      ${themeToggleButton('icon-button topbar-theme-toggle', !isAdminSection ? 'data-tour-target="HEADER_THEME"' : '')}
      <a data-link href="${isAdminSection ? '/admin/profile' : '/panel/account'}" class="avatar avatar--small" aria-label="حساب کاربری" ${!isAdminSection ? 'data-tour-target="HEADER_PROFILE"' : ''}>${icon('person')}</a>
    </div></header><main class="content">${content}</main></section>
  </div>`;
  initializeTheme();
  bindShell();
  if (!isAdminSection) bindDashboardTourGuide();
  if (isAdminSection) userChrome.stop(); else userChrome.start();
}

function bindShell(): void {
  const setSidebar = (open: boolean): void => {
    store.set({ sidebarOpen: open });
    document.querySelector('.app-shell')?.classList.toggle('app-shell--sidebar-open', open);
  };
  document.querySelector('[data-sidebar-open]')?.addEventListener('click', () => setSidebar(true));
  qsa('[data-sidebar-close]').forEach((node) => node.addEventListener('click', () => setSidebar(false)));
  document.querySelector<HTMLButtonElement>('[data-product-subtree-toggle]')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const open = !store.get().productSubtreeOpen;
    store.set({ productSubtreeOpen: open });
    const group = (event.currentTarget as HTMLElement).closest<HTMLElement>('.nav-group');
    group?.classList.toggle('nav-group--open', open);
    const subtree = group?.querySelector<HTMLElement>('.nav-subtree');
    if (subtree) subtree.hidden = !open;
    const button = event.currentTarget as HTMLButtonElement;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'بستن دسته‌های محصولات' : 'نمایش دسته‌های محصولات');
    button.innerHTML = icon(open ? 'expand_less' : 'expand_more');
  });
  document.querySelector('[data-charge-wallet-header]')?.addEventListener('click', openChargeWalletDialog);
  document.querySelector('[data-logout]')?.addEventListener('click', () => void runAction(async () => {
    try {
      return await api.call('logout', {});
    } finally {
      invalidateUserProfile();
      store.setIdentity({ status: 'guest', userId: null, role: null });
      router.navigate('/');
    }
  }));
}

subscribeBackendAvailability(() => syncBackendAvailabilityUi());
