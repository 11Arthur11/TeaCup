import { bindLandingLoader, landingLoaderMarkup } from './landing.js';
import { renderPublic, syncBackendAvailabilityUi } from '../ui/layout.js';
import { escapeHtml } from '../core/dom.js';
import { apiBaseUrl } from '../api/client.js';
import { getPublicCategories, getPublicProducts } from '../api/public-catalog.js';
import { probeBackendAvailability } from '../core/backend-availability.js';
import { parseProductPresentation, renderProductCard } from '../ui/product-presentation.js';

// Inline icons keep this page readable while the external icon font is loading.
const paths = {
  cancel: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  arrow: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  voice: '<path d="M4 10v4m4-7v10m4-14v18m4-14v10m4-7v4"/>',
  music: '<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="17" cy="16" rx="3" ry="3"/>',
  server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M12 6.5h5m-5 11h5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wallet: '<path d="M20 8V5H5a2 2 0 0 1 0-4h13v4M3 3v16a2 2 0 0 0 2 2h15V8H5"/><path d="M21 11h-6v6h6zM17 14h.01"/>',
  headphones: '<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="2" y="12" width="5" height="9" rx="2"/><rect x="17" y="12" width="5" height="9" rx="2"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  cloud: '<path d="M6 19a5 5 0 1 1 0-10 7 7 0 0 1 13-2 6 6 0 0 1-1 12Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
} as const;
function svg(name: keyof typeof paths): string {
  return `<svg class="lv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
function wave(className = ''): string {
  return `<div class="lv-wave ${className}" aria-hidden="true">${Array.from({ length: 38 }, (_, i) => `<i style="--bar:${[18, 30, 46, 25, 56, 72, 42, 88, 61, 35, 77, 98, 53, 70, 41, 90, 63, 32, 52][i % 19]}%;--delay:${i % 7 * -0.19}s"></i>`).join('')}</div>`;
}
const faqs = [
  ['TeaSpeak و AudioBot چه تفاوتی دارند؟', 'TeaSpeak فضای گفت‌وگوی صوتی گروه شماست. AudioBot ربات پخش موسیقی است که به سرور صوتی متصل می‌شود. می‌توانید متناسب با نیازتان، هر سرویس را جداگانه از فهرست محصولات انتخاب کنید.'],
  ['می‌توانم سرویس را برای مدت کوتاه بخرم؟', 'بله. دوره‌های قابل خرید برای هر محصول در فهرست محصولات و هنگام سفارش مشخص می‌شوند. ظرفیت و مدت موردنیازتان را انتخاب کنید و مبلغ نهایی را پیش از تأیید خرید ببینید.'],
  ['بعد از خرید، اطلاعات اتصال را کجا ببینم؟', 'پس از آماده‌شدن سرویس، از بخش «سرویس‌های من» در داشبورد وارد جزئیات آن شوید. اطلاعات اتصال، وضعیت سرویس و گزینه‌های مدیریت در همان بخش در دسترس هستند.'],
  ['پرداخت و تمدید چطور انجام می‌شود؟', 'کیف پول حساب را شارژ می‌کنید و سفارش را از داشبورد ثبت می‌کنید. اطلاعات مالی و زمان پایان سرویس در پنل نمایش داده می‌شوند؛ گزینه‌های تمدید هر سرویس را هم در صفحه جزئیات آن می‌بینید.'],
  ['اگر برای راه‌اندازی کمک بخواهم چه کار کنم؟', 'از بخش پشتیبانی داشبورد تیکت ثبت کنید. می‌توانید توضیحات و فایل‌های مرتبط را بفرستید و پاسخ‌ها را در همان گفت‌وگو دنبال کنید.'],
];

export function renderLandingV2(): void {
  renderPublic(`${landingLoaderMarkup()}<div class="lv-page" dir="rtl">
    <section class="lv-stage-hero" aria-labelledby="lv-title">
      <div class="lv-container">
        <div class="lv-stage-copy">
          <span class="lv-stage-eyebrow"><span></span> ابر چایی، فضای مشترک شما</span>
          <h1 id="lv-title">کنار هم، <em>حتی از دور.</em></h1>
          <p>یک فضای اختصاصی برای گفت‌وگو، بازی و موسیقی.<br>با سرور <bdi>TeaSpeak</bdi> و ربات <bdi>AudioBot</bdi>، جمع شما همیشه یک جای خوب برای دورهم‌بودن دارد.</p>
          <div class="lv-stage-actions"><a data-link href="/products" class="button button--primary button--large">فضای خودتان را بسازید ${svg('arrow')}</a><a href="#lv-services" class="lv-stage-secondary">آشنایی با سرویس‌ها <span>↓</span></a></div>
        </div>
        <div class="lv-soundscape" role="img" aria-label="تصویر مفهومی اتصال گفت‌وگو و موسیقی به ابر چایی">
          <div class="lv-soundscape-inner" aria-hidden="true">
            <div class="lv-sound-halo"></div><div class="lv-sound-orbit lv-sound-orbit--outer"></div><div class="lv-sound-orbit lv-sound-orbit--inner"></div>
            <svg class="lv-sound-wires" viewBox="0 0 1000 300" fill="none"><defs><linearGradient id="lv-wire-gradient"><stop stop-color="#9982ed"/><stop offset=".5" stop-color="#629eff"/><stop offset="1" stop-color="#4bcdd3"/></linearGradient></defs><path d="M170 147H310Q350 147 350 180T400 210H600Q650 210 650 180T690 147H830"/><path class="lv-sound-wire-flow" d="M170 147H310Q350 147 350 180T400 210H600Q650 210 650 180T690 147H830"/></svg>
            <div class="lv-sound-service lv-sound-service--voice"><span class="lv-sound-icon">${svg('voice')}</span><div><bdi>TeaSpeak</bdi><span>صدای آشنای جمع</span></div><div class="lv-voice-pips"><i></i><i></i><i></i><i></i><i></i></div></div>
            <div class="lv-sound-cloud">
              <svg class="lv-cloud-shape" viewBox="0 0 320 210" fill="none"><defs><linearGradient id="lv-cloud-fill" x1="100" y1="15" x2="200" y2="200" gradientUnits="userSpaceOnUse"><stop stop-color="var(--lv-cloud-top)"/><stop offset="1" stop-color="var(--lv-cloud-bottom)"/></linearGradient><linearGradient id="lv-cloud-edge"><stop stop-color="#4178bc"/><stop offset=".5" stop-color="#9cc5ff"/><stop offset="1" stop-color="#4178bc"/></linearGradient></defs><path d="M78 176C44 176 20 153 20 123C20 95 39 73 66 70C73 37 104 17 136 25C162 0 205 8 225 39C255 37 280 58 280 88C309 110 306 153 277 169C266 175 256 176 244 176Z" fill="url(#lv-cloud-fill)" stroke="url(#lv-cloud-edge)" stroke-width="1.3"/><path d="M70 75C78 46 104 30 134 37" stroke="#b7d6ff" stroke-opacity=".3" stroke-linecap="round"/></svg>
              <div class="lv-cloud-brand"><img src="/assets/teacloud-logo.png" alt=""><span>ابر چایی</span><small>جای جمع شما اینجاست.</small></div>
              <div class="lv-cloud-platform"></div>
            </div>
            <div class="lv-sound-service lv-sound-service--music"><span class="lv-sound-icon">${svg('music')}</span><div><bdi>AudioBot</bdi><span>موسیقیِ لحظه‌های شما</span></div><div class="lv-vinyl"><i></i></div></div>
            <span class="lv-sound-spark lv-sound-spark--one">${svg('headphones')}</span><span class="lv-sound-spark lv-sound-spark--two">${svg('music')}</span>
            <div class="lv-sound-caption"><span></span> فاصله کمتر. لحظه‌های بیشتر. <span></span></div>
          </div>
        </div>
        <div class="lv-stage-promises"><span>${svg('clock')} مدت و ظرفیت دلخواه</span><i></i><span>${svg('grid')} مدیریت در یک داشبورد</span><i></i><span>${svg('headphones')} پشتیبانی فارسی</span></div>
      </div>
      <div class="lv-container lv-hero-bottom"><span>برای هر جمع، یک فضای اختصاصی</span><div><span>${svg('headphones')} تیم‌های گیمینگ</span><span>${svg('voice')} جمع‌های دوستانه</span><span>${svg('globe')} کامیونیتی‌ها</span></div><bdi>TEACLOUD / CONNECT TOGETHER</bdi></div>
    </section>

    <section class="lv-section lv-container" id="lv-services" aria-labelledby="lv-services-title"><div class="lv-section-heading"><div><span class="lv-kicker">۰۱ / سرویس‌های ابر چایی</span><h2 id="lv-services-title">یک جمع. دو راه برای نزدیک‌تر شدن.</h2></div><p>شما به گفت‌وگو و موسیقی برسید؛<br>مدیریت سرویس را از پنل دنبال کنید.</p></div>
    <div class="lv-service-grid"><article class="lv-service-card"><div class="lv-service-top"><span class="lv-service-icon">${svg('voice')}</span><bdi>01 / TEASPEAK</bdi></div><h3>جایی برای شنیدن همدیگر.</h3><p>فضای صوتی اختصاصی برای هماهنگی تیم، بازی و گفت‌وگو؛ با ظرفیت مناسب جمع شما و تنظیمات در دسترس.</p><ul><li>${svg('check')} انتخاب ظرفیت و دوره سرویس</li><li>${svg('check')} مشاهده وضعیت و اطلاعات اتصال</li><li>${svg('check')} مدیریت و تمدید از داشبورد</li></ul><a href="#lv-plans" class="lv-card-link">بررسی سرویس‌های صوتی ${svg('arrow')}</a><div class="lv-server-art" aria-hidden="true"><div><span></span><i></i><i></i><i></i><b>TEA / 01</b></div><div><span></span><i></i><i></i><i></i><b>TEA / 02</b></div><div><span></span><i></i><i></i><i></i><b>TEA / 03</b></div></div></article>
    <article class="lv-service-card lv-service-card--audio"><div class="lv-service-top"><span class="lv-service-icon">${svg('music')}</span><bdi>02 / AUDIOBOT</bdi></div><h3>حال‌وهوای جمع را پخش کنید.</h3><p>ربات موسیقی ابری در کنار سرور صوتی؛ برای ساختن فهرست پخش و کنترل آهنگ‌ها، بدون شلوغی و پیچیدگی.</p><ul><li>${svg('check')} مدیریت فهرست‌های پخش</li><li>${svg('check')} کنترل پخش از پنل اختصاصی</li><li>${svg('check')} تنظیم اتصال به سرور صوتی</li></ul><a href="#lv-plans" class="lv-card-link">بررسی ربات‌های موسیقی ${svg('arrow')}</a><div class="lv-audio-art" aria-hidden="true"><div class="lv-record"><span>${svg('music')}</span></div>${wave()}</div></article></div></section>

    <section class="lv-feature-section" id="lv-features" aria-labelledby="lv-features-title"><div class="lv-container"><div class="lv-section-heading"><div><span class="lv-kicker">۰۲ / همه‌چیز در دسترس شما</span><h2 id="lv-features-title">پشت یک تجربه ساده،<br>یک داشبورد کامل است.</h2></div><a data-link data-dashboard-access href="/auth" class="lv-text-action">ورود به داشبورد ${svg('arrow')}</a></div>
    <div class="lv-feature-grid"><article class="lv-feature-main"><span class="lv-feature-icon">${svg('grid')}</span><h3>از اولین خرید تا تمدید بعدی.</h3><p>وضعیت سرویس‌ها، زمان باقی‌مانده، تراکنش‌ها و پیام‌های پشتیبانی را یک‌جا ببینید. برای هر کار، مسیر مشخصی پیش روی شماست.</p><div class="lv-management-list"><div>${svg('server')}<span>سرویس‌های من</span><small>وضعیت و اطلاعات اتصال</small></div><div>${svg('wallet')}<span>کیف پول و صورتحساب‌ها</span><small>شفاف و قابل پیگیری</small></div><div>${svg('headphones')}<span>تیکت‌های پشتیبانی</span><small>گفت‌وگو در کنار سرویس</small></div></div></article>
    <article class="lv-feature-small"><span class="lv-feature-icon">${svg('clock')}</span><h3>به اندازه نیازتان انتخاب کنید.</h3><p>دوره‌های هر محصول را ببینید و برای زمانی که واقعاً به سرویس نیاز دارید تصمیم بگیرید.</p><div class="lv-periods"><span>ساعتی</span><span>روزانه</span><span>ماهانه</span></div><small>بسته به دوره‌های فعال هر محصول</small></article>
    <article class="lv-feature-small"><span class="lv-feature-icon">${svg('wallet')}</span><h3>یک بار پرداخت، چندین محصول.</h3><p>با کیف پول، خریدهای بعدی را راحت‌تر انجام دهید و تاریخچه پرداخت‌ها و صورتحساب‌ها را در حساب خود نگه دارید.</p><div class="lv-wallet-art" aria-hidden="true">${svg('wallet')}<span>کیف پول ابر چایی</span>${svg('check')}</div></article></div></div></section>

    <section class="lv-section lv-container lv-start" aria-labelledby="lv-start-title"><div><span class="lv-kicker">۰۳ / شروعی ساده</span><h2 id="lv-start-title">از انتخاب سرویس،<br>تا اولین «سلام».</h2><p>مسیر راه‌اندازی را از همین‌جا شروع کنید.</p></div><ol class="lv-steps"><li><span>۱</span><div><h3>سرویس مناسب را پیدا کنید</h3><p>نوع سرویس، ظرفیت و دوره موردنیازتان را انتخاب کنید.</p></div></li><li><span>۲</span><div><h3>وارد شوید و سفارش را ثبت کنید</h3><p>کیف پول را شارژ کنید و جزئیات خرید را تأیید کنید.</p></div></li><li><span>۳</span><div><h3>جمع‌تان را دعوت کنید</h3><p>اطلاعات اتصال را از داشبورد بردارید و کنار هم باشید.</p></div></li></ol></section>

    <section class="lv-plan-section" id="lv-plans" aria-labelledby="lv-plans-title"><div class="lv-container"><div class="lv-section-heading"><div><span class="lv-kicker">۰۴ / انتخاب سرویس</span><h2 id="lv-plans-title">برای جمع شما، چه سرویسی مناسب است؟</h2><p>محصولات و قیمت‌های فعلی؛ مستقیم از فهرست ابر چایی.</p></div><a data-link href="/products" class="lv-text-action">همه محصولات ${svg('arrow')}</a></div><div class="lv-catalog" data-v2-catalog><div class="lv-catalog-tabs" data-v2-categories role="group" aria-label="دسته‌بندی محصولات"></div><p class="lv-category-caption" data-v2-caption></p><div class="lv-product-grid" data-v2-products aria-live="polite" aria-busy="true"><div class="lv-catalog-state" role="status">در حال دریافت سرویس‌ها…</div></div></div></div></section>

    <section class="lv-section lv-container lv-faq" aria-labelledby="lv-faq-title"><div><span class="lv-kicker">۰۵ / قبل از شروع</span><h2 id="lv-faq-title">شاید سؤال شما<br>هم همین باشد.</h2><p>برای انتخاب آگاهانه‌تر،<br>از همین چند پاسخ شروع کنید.</p><a data-link href="/rules" class="lv-text-action">مطالعه قوانین خدمات ${svg('arrow')}</a></div><div class="lv-faq-list">${faqs.map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${q}${svg('plus')}</summary><p>${a}</p></details>`).join('')}</div></section>

    <section class="lv-container lv-closing"><div class="lv-closing-visual" aria-hidden="true">${svg('cloud')}${wave()}</div><span class="lv-kicker">جمع خوب، صدای خوب می‌خواهد.</span><h2>جای جمع شما روی ابر خالی‌ست.</h2><p>سرویس‌تان را انتخاب کنید؛ گفت‌وگوی بعدی از همین‌جا شروع می‌شود.</p><a data-link href="/products" class="button button--primary button--large">شروع با ابر چایی ${svg('arrow')}</a><div class="lv-closing-note">TeaSpeak <span>+</span> AudioBot <span>+</span> شما</div></section>
    </div>`);

  const page = document.querySelector<HTMLElement>('.lv-page')!;
  const shell = page.closest<HTMLElement>('.public-shell')!;
  shell.classList.add('public-shell--v2');
  // Native fragment links retain browser history and work without router re-renders.
  const nav = shell.querySelector('nav');
  if (nav) {
    nav.id = 'lv-navigation';
    nav.setAttribute('aria-label', 'ناوبری اصلی');
    nav.innerHTML = '<a href="#lv-services">سرویس‌ها</a><a href="#lv-features">امکانات</a><a href="#lv-plans">تعرفه‌ها</a><a href="#lv-faq-title">سؤالات متداول</a>';
  }
  const actions = shell.querySelector('.public-header__actions');
  actions?.insertAdjacentHTML('afterbegin', `<button type="button" class="icon-button lv-menu-toggle" aria-label="فهرست صفحه" aria-expanded="false" aria-controls="lv-navigation">${svg('menu')}</button>`);
  const menu = shell.querySelector<HTMLButtonElement>('.lv-menu-toggle');
  const setMenu = (open: boolean): void => {
    menu?.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('lv-nav-open', open);
  };
  menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav?.addEventListener('click', () => setMenu(false));
  shell.querySelector('.public-header')?.addEventListener('keydown', event => {
    if ((event as KeyboardEvent).key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menu.focus();
    }
  });
  const brand = shell.querySelector<HTMLAnchorElement>('.public-header .brand');
  if (brand) brand.href = '/';
  const footer = shell.querySelector('.public-footer');
  footer?.insertAdjacentHTML('beforeend', '<div class="lv-footer-links"><a data-link href="/products">محصولات</a><a data-link href="/rules">قوانین خدمات</a></div>');

  void loadCatalog(page);
  void probeBackendAvailability(apiBaseUrl).then(() => { if (page.isConnected) syncBackendAvailabilityUi(); });
  const sectionId = ({ '#features': 'lv-features', '#products': 'lv-plans' } as Record<string, string>)[location.hash]
    ?? (location.hash.startsWith('#lv-') ? location.hash.slice(1) : '');
  void bindLandingLoader().then(() => {
    if (sectionId && page.isConnected) {
      requestAnimationFrame(() => page.querySelector(`#${CSS.escape(sectionId)}`)?.scrollIntoView());
    }
  });
}

async function loadCatalog(page: HTMLElement): Promise<void> {
  const tabs = page.querySelector<HTMLElement>('[data-v2-categories]')!;
  const grid = page.querySelector<HTMLElement>('[data-v2-products]')!;
  const caption = page.querySelector<HTMLElement>('[data-v2-caption]')!;
  let request = 0;
  const loading = (): void => { grid.setAttribute('aria-busy', 'true'); grid.innerHTML = '<div class="lv-catalog-state" role="status">در حال دریافت سرویس‌ها…</div>'; };
  const errorState = (retry: () => void): void => {
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = `<div class="lv-catalog-state">${svg('cloud')}<h3>فهرست سرویس‌ها فعلاً در دسترس نیست.</h3><p>دریافت قیمت‌ها انجام نشد. کمی بعد دوباره تلاش کنید.</p><button type="button" class="button button--secondary" data-v2-retry>تلاش دوباره</button></div>`;
    grid.querySelector('[data-v2-retry]')?.addEventListener('click', retry);
  };
  loading();
  try {
    const categories = await getPublicCategories();
    if (!page.isConnected) return;
    if (!categories.length) {
      grid.setAttribute('aria-busy', 'false');
      grid.innerHTML = '<div class="lv-catalog-state"><h3>سرویس‌های تازه در راه‌اند.</h3><p>در حال حاضر محصول عمومی فعالی برای نمایش وجود ندارد.</p></div>';
      return;
    }
    tabs.innerHTML = categories.map((c, i) => `<button type="button" data-v2-category="${i}" aria-pressed="false">${escapeHtml(c.name)}</button>`).join('');
    const select = async (index: number, force = false): Promise<void> => {
      const category = categories[index];
      if (!category) return;
      const version = ++request;
      tabs.querySelectorAll<HTMLButtonElement>('button').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.v2Category) === index)));
      caption.textContent = category.description;
      loading();
      try {
        const products = await getPublicProducts(category.slug, force);
        if (!page.isConnected || version !== request) return;
        grid.innerHTML = products.length ? products.slice(0, 3).map(product => renderProductCard({
          productId: product.id, productName: product.productName, productType: product.productType,
          price: product.price, period: product.period, maxClients: product.maxClients,
          presentation: parseProductPresentation(product.presentation), actionLabel: 'بررسی و انتخاب سرویس', actionHref: '/products',
        })).join('') : '<div class="lv-catalog-state"><h3>هنوز محصولی در این دسته نیست.</h3><p>می‌توانید دسته‌های دیگر را بررسی کنید.</p></div>';
        const productIcons: Record<string, keyof typeof paths> = { dns: 'server', headphones: 'headphones', check_circle: 'check', cancel: 'cancel', arrow_back: 'arrow' };
        grid.querySelectorAll('.material-symbols-rounded').forEach(node => {
          const name = productIcons[node.textContent?.trim() ?? ''];
          if (name) node.outerHTML = svg(name);
        });
        grid.setAttribute('aria-busy', 'false');
      } catch {
        if (page.isConnected && version === request) errorState(() => void select(index, true));
      }
    };
    tabs.querySelectorAll<HTMLButtonElement>('button').forEach(button => button.addEventListener('click', () => void select(Number(button.dataset.v2Category))));
    await select(0);
  } catch {
    if (page.isConnected) errorState(() => void loadCatalog(page));
  }
}
