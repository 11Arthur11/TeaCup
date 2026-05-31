import { api, apiBaseUrl } from '../api/client.js';
import { canAccessAdminArea, hasAdminPanelAccess, roleLabel, type AdminArea } from '../core/authorization.js';
import { runAction } from '../core/action.js';
import { getBackendAvailability, probeBackendAvailability, subscribeBackendAvailability } from '../core/backend-availability.js';
import { openDialog } from '../core/dialog.js';
import { appRoot, bellIcon, brandLogo, escapeHtml, icon, qsa } from '../core/dom.js';
import { hasPendingPageInteraction, isBackgroundPageRefresh } from '../core/page-refresh.js';
import { router } from '../core/router.js';
import { clearSessionHint } from '../core/session.js';
import { store } from '../core/store.js';
import { userChrome } from '../core/user-chrome.js';
import { openChargeWalletDialog } from '../core/wallet-action.js';

interface NavItem { label: string; href: string; icon: string; area?: AdminArea; }

const userNav: NavItem[] = [
  { label: 'داشبورد نمای کلی', href: '/panel', icon: 'dashboard' },
  { label: 'سرویس‌های من', href: '/panel/services', icon: 'dns' },
  { label: 'محصولات', href: '/panel/products', icon: 'shopping_bag' },
  { label: 'مالی', href: '/panel/finance', icon: 'account_balance_wallet' },
  { label: 'پشتیبانی', href: '/panel/tickets', icon: 'support_agent' },
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
  { label: 'مانیتورینگ', href: '/admin/monitoring', icon: 'monitor_heart', area: 'liveStatus' },
];

function isActive(href: string, current: string): boolean {
  return href === current || (href !== '/panel' && href !== '/admin' && current.startsWith(`${href}/`));
}

function navItemHtml(item: NavItem, current: string): string {
  return `<a data-link class="nav-item ${isActive(item.href, current) ? 'nav-item--active' : ''}" href="${item.href}">${icon(item.icon)}<span>${escapeHtml(item.label)}</span></a>`;
}

function userNavHtml(current: string): string {
  return userNav.map((item) => {
    const base = navItemHtml(item, current);
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
  qsa<HTMLElement>('[data-dashboard-access]').forEach((node) => node.addEventListener('click', (event) => {
    if (getBackendAvailability() !== 'unavailable') return;
    event.preventDefault();
    event.stopPropagation();
    showPublicMaintenanceDialog();
  }));
  document.querySelector<HTMLButtonElement>('[data-maintenance-retry]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    button.disabled = true;
    await probeBackendAvailability(apiBaseUrl);
    button.disabled = false;
    syncBackendAvailabilityUi();
  });
  syncBackendAvailabilityUi();
}

export function renderPublic(content: string, options: { transparent?: boolean } = {}): void {
  userChrome.stop();
  const root = appRoot();
  root.innerHTML = `<div class="public-shell ${options.transparent ? 'public-shell--transparent' : ''}">
    <header class="public-header"><a data-link href="/" class="brand"><span class="brand__mark">${brandLogo('brand__logo')}</span><span><b>ابر چایی</b><small>TeaCloud</small></span></a>
    <nav><a data-link href="/#services">سرویس‌ها</a><a data-link href="/#features">امکانات</a><a data-link href="/#pricing">تعرفه‌ها</a></nav>
    <div class="public-header__actions"><a data-link data-dashboard-access class="button button--primary" href="/auth">ورود به پنل</a></div></header>
    <section class="maintenance-banner" data-maintenance-banner hidden>${icon('engineering')}<div><b>سامانه موقتاً در حالت نگهداری است</b><span>ارتباط با backend برقرار نیست و ورود به داشبورد تا بازگشت سرویس غیرفعال شده است.</span></div><button type="button" class="button button--ghost button--small" data-maintenance-retry>${icon('refresh')} بررسی دوباره</button></section>
    <main>${content}</main><footer class="public-footer"><div class="brand"><span class="brand__mark">${brandLogo('brand__logo')}</span><span><b>ابر چایی</b><small>TeaCloud</small></span></div><p>زیرساخت حرفه‌ای ارتباط صوتی، ساده و مطمئن.</p><span>© ۱۴۰۵ ابر چایی</span></footer></div>`;
  bindPublicShell();
}

export function renderAppShell(content: string, title = ''): void {
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
  const root = appRoot();

  root.innerHTML = `<div class="app-shell ${state.sidebarOpen ? 'app-shell--sidebar-open' : ''}">
    <div class="sidebar-backdrop" data-sidebar-close></div>
    <aside class="sidebar">
      <div class="sidebar__top"><a data-link href="${isAdminSection ? '/admin' : '/panel'}" class="brand brand--sidebar"><span class="brand__mark">${brandLogo('brand__logo')}</span><span><b>ابر چایی</b><small>TeaCloud</small></span></a><button type="button" class="icon-button sidebar__mobile-close" data-sidebar-close>${icon('close')}</button></div>
      <div class="sidebar__scroll"><span class="nav-label">${panelTitle}</span><nav>${nav}</nav></div>
      <div class="sidebar__footer"><div class="sidebar-user"><span class="avatar">${icon(isAdminSection ? switchIcon : 'person')}</span><div><b>${panelTitle}</b><small>${escapeHtml(roleLabel(state.identity.role))}</small></div></div><button type="button" class="icon-button" data-logout title="خروج">${icon('logout')}</button></div>
    </aside>
    <section class="workspace"><header class="topbar"><div><button type="button" class="icon-button topbar__menu" data-sidebar-open>${icon('menu')}</button><div class="topbar__title"><small>${panelTitle}</small><b>${escapeHtml(title || 'ابر چایی')}</b></div></div><div class="topbar__actions">
      ${!isAdminSection ? `<div class="topbar-wallet"><span><small>موجودی</small><b data-user-wallet-balance>۰ تومان</b></span><button type="button" class="topbar-wallet__add" data-charge-wallet-header aria-label="شارژ کیف پول" title="شارژ کیف پول">${icon('add')}</button></div><button type="button" class="icon-button topbar-notification" data-user-notifications-open aria-label="اعلان‌های عمومی" title="اعلان‌های عمومی">${bellIcon('topbar-notification__icon')}<span class="topbar-notification__count" data-user-notification-count>۰</span></button>` : ''}
      ${hasAdminPanelAccess(state.identity.role) ? `<a data-link href="${switchHref}" class="button button--secondary button--small panel-switch">${icon(switchIcon)} ${switchLabel}</a>` : ''}
      <a data-link href="/panel/account" class="avatar avatar--small" aria-label="حساب کاربری">${icon('person')}</a>
    </div></header><main class="content">${content}</main></section>
  </div>`;
  bindShell();
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
      clearSessionHint();
      store.setIdentity({ status: 'guest', userId: null, role: null });
      router.navigate('/');
    }
  }));
}

subscribeBackendAvailability(() => syncBackendAvailabilityUi());
