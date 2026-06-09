import { renderPublic, syncBackendAvailabilityUi } from '../ui/layout.js';
import { apiBaseUrl } from '../api/client.js';
import { getPublicCategories, getPublicProducts, type PublicCatalogCategory, type PublicCatalogProduct } from '../api/public-catalog.js';
import { probeBackendAvailability } from '../core/backend-availability.js';
import { brandLogo, escapeHtml, icon, qsa } from '../core/dom.js';
import { parseProductPresentation, renderProductCard } from '../ui/product-presentation.js';
import { startLandingCreature, stopLandingCreature } from '../ui/landing-creature.js';

let landingCategoryTimer = 0;
let landingRenderVersion = 0;

function stopLandingCategoryRotation(): void {
  stopLandingCreature();
  window.clearInterval(landingCategoryTimer);
  landingCategoryTimer = 0;
  landingRenderVersion += 1;
}

function publicProductCard(product: PublicCatalogProduct): string {
  return renderProductCard({
    productId: product.id,
    productName: product.productName,
    productType: product.productType,
    price: product.price,
    period: product.period,
    maxClients: product.maxClients,
    presentation: parseProductPresentation(product.presentation),
    actionLabel: 'انتخاب در داشبورد',
    actionHref: '/auth',
    actionDataDashboardAccess: true,
  });
}

function categoryTabs(categories: PublicCatalogCategory[], activeSlug: string, all = false): string {
  const allTab = all
    ? `<button type="button" class="public-category-tab ${activeSlug === '*' ? 'is-active' : ''}" data-public-category="*">همه محصولات</button>`
    : '';
  return `${allTab}${categories.map((category) => `<button type="button" class="public-category-tab ${category.slug === activeSlug ? 'is-active' : ''}" data-public-category="${escapeHtml(category.slug)}" title="${escapeHtml(category.description)}">${escapeHtml(category.name)}</button>`).join('')}`;
}

function catalogError(message: string): string {
  return `<div class="public-catalog-state public-catalog-state--error">${icon('cloud_off')}<div><b>دریافت محصولات انجام نشد</b><p>${escapeHtml(message)}</p></div><button type="button" class="button button--secondary button--small" data-retry-public-catalog>${icon('refresh')} تلاش دوباره</button></div>`;
}

async function hydrateLandingProducts(version: number): Promise<void> {
  const tabs = document.querySelector<HTMLElement>('[data-landing-category-tabs]');
  const grid = document.querySelector<HTMLElement>('[data-landing-product-grid]');
  const caption = document.querySelector<HTMLElement>('[data-landing-category-caption]');
  if (!tabs || !grid || !caption) return;

  try {
    const categories = await getPublicCategories();
    if (version !== landingRenderVersion) return;
    if (!categories.length) {
      tabs.innerHTML = '';
      grid.innerHTML = `<div class="public-catalog-state">${icon('inventory_2')}<div><b>هنوز محصول عمومی منتشر نشده است</b><p>پس از فعال‌شدن دسته‌ها، محصولات در این بخش دیده می‌شوند.</p></div></div>`;
      caption.textContent = 'فهرست عمومی فعالی وجود ندارد.';
      return;
    }

    let activeIndex = 0;
    let requestVersion = 0;
    const renderCategory = async (index: number): Promise<void> => {
      if (!tabs.isConnected || !grid.isConnected) { window.clearInterval(landingCategoryTimer); return; }
      activeIndex = (index + categories.length) % categories.length;
      const category = categories[activeIndex]!;
      const localRequest = ++requestVersion;
      tabs.innerHTML = categoryTabs(categories, category.slug);
      caption.textContent = category.description || `محصولات دسته ${category.name}`;
      grid.classList.add('is-loading');
      grid.innerHTML = `<div class="public-catalog-loading"><span class="spinner"></span>در حال دریافت محصولات ${escapeHtml(category.name)}...</div>`;
      try {
        const products = await getPublicProducts(category.slug);
        if (version !== landingRenderVersion || localRequest !== requestVersion) return;
        grid.innerHTML = products.length
          ? products.slice(0, 3).map(publicProductCard).join('')
          : `<div class="public-catalog-state">${icon('inventory_2')}<div><b>محصولی در این دسته وجود ندارد</b><p>دسته بعدی به‌صورت خودکار نمایش داده می‌شود.</p></div></div>`;
      } catch (error) {
        if (version !== landingRenderVersion || localRequest !== requestVersion) return;
        grid.innerHTML = catalogError(error instanceof Error ? error.message : 'ارتباط با فهرست عمومی برقرار نشد.');
        grid.querySelector('[data-retry-public-catalog]')?.addEventListener('click', () => void renderCategory(activeIndex));
      } finally {
        if (version === landingRenderVersion && localRequest === requestVersion) grid.classList.remove('is-loading');
      }
      qsa<HTMLButtonElement>('[data-public-category]', tabs).forEach((button) => button.addEventListener('click', () => {
        const selected = categories.findIndex((item) => item.slug === button.dataset.publicCategory);
        if (selected < 0) return;
        window.clearInterval(landingCategoryTimer);
        void renderCategory(selected);
        landingCategoryTimer = window.setInterval(() => void renderCategory(activeIndex + 1), 7_000);
      }));
    };

    await renderCategory(0);
    landingCategoryTimer = window.setInterval(() => void renderCategory(activeIndex + 1), 7_000);
  } catch (error) {
    if (version !== landingRenderVersion) return;
    tabs.innerHTML = '';
    grid.innerHTML = catalogError(error instanceof Error ? error.message : 'فهرست دسته‌بندی‌ها دریافت نشد.');
    grid.querySelector('[data-retry-public-catalog]')?.addEventListener('click', () => void hydrateLandingProducts(version));
  }
}

function bindLandingBackToTop(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-landing-back-to-top]');
  if (!button) return;
  const sync = (): void => {
    if (!button.isConnected) { window.removeEventListener('scroll', sync); return; }
    button.classList.toggle('is-visible', window.scrollY > 520);
  };
  window.addEventListener('scroll', sync, { passive: true });
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  sync();
}

export function renderLanding(): void {
  stopLandingCategoryRotation();
  const version = landingRenderVersion;
  renderPublic(`
    <div class="landing-creature" data-landing-creature aria-hidden="true">
      <div class="landing-creature__ambient"></div>
      <div class="landing-creature__grid" data-landing-creature-grid></div>
    </div>
    <section class="tea-hero landing-glass-section">
      <div class="tea-hero__pattern"></div>
      <div class="tea-hero__inner">
        <div class="tea-hero__copy">
          <span class="tea-kicker">${icon('local_cafe')} سرویس صوتی، به سبک ابر چایی</span>
          <h1>خرید سرور TeaSpeak،<br/><em>به آسانی نوشیدن چای.</em></h1>
          <p>خسته شدی برای یک روز بازی، مجبور باشی هزینه یک ماه سرور را بدهی؟ کیف پول ابر چایی را یک‌بار شارژ کن و هر زمان خواستی، سرویس را دقیقاً برای همان مدتی که نیاز داری فعال کن.</p>
          <div class="tea-hero__actions">
            <a data-link data-dashboard-access href="/auth" class="button button--primary button--large">ورود و شروع خرید ${icon('arrow_back')}</a>
            <a data-link href="/products" class="button button--glass button--large">دیدن محصولات</a>
          </div>
          <div class="tea-hero__promises">
            <span>${icon('timer')} خرید از یک ساعت</span>
            <span>${icon('account_balance_wallet')} پرداخت با کیف پول</span>
            <span>${icon('support_agent')} پشتیبانی فارسی</span>
          </div>
        </div>

        <div class="tea-hero__visual" aria-label="نمای مفهومی ابر چایی">
          <div class="tea-cup-scene">
            <div class="tea-steam tea-steam--one"></div><div class="tea-steam tea-steam--two"></div><div class="tea-steam tea-steam--three"></div>
            <div class="tea-cup"><span>${brandLogo('tea-cup__logo')}</span></div>
            <div class="tea-saucer"></div>
            <article class="tea-float-card tea-float-card--service">${icon('graphic_eq')}<div><b>سرویس شما آماده است!</b><small>تحویل خودکار</small></div></article>
            <article class="tea-float-card tea-float-card--wallet">${icon('account_balance_wallet')}<div><b>کنترل کامل</b><small>همه چیز در داشبورد تو</small></div></article>
            <article class="tea-float-card tea-float-card--period">${icon('schedule')}<div><b>مدت دلخواه</b><small>ساعتی، روزانه یا ماهانه</small></div></article>
          </div>
        </div>
      </div>
    </section>

    <section class="tea-story-strip landing-glass-panel">
      <div><span>۱</span><b>کیف پول را شارژ کن</b><small>یک‌بار پرداخت، خریدهای بعدی سریع‌تر</small></div>
      <i>${icon('arrow_back')}</i>
      <div><span>۲</span><b>مدت را انتخاب کن</b><small>از چند ساعت تا دوره‌های بلندتر</small></div>
      <i>${icon('arrow_back')}</i>
      <div><span>۳</span><b>سرویس را تحویل بگیر</b><small>مشخصات اتصال در داشبورد شما</small></div>
    </section>

    <section id="products" class="public-products-section landing-glass-panel landing-glass-panel--wide">
      <div class="public-section-heading public-section-heading--split">
        <div><span>محصولات عمومی</span><h2>همان‌قدر بخر که استفاده می‌کنی</h2><p data-landing-category-caption>دسته‌بندی‌ها و قیمت‌ها از فهرست عمومی ابر چایی دریافت می‌شوند.</p></div>
        <a data-link href="/products" class="button button--secondary">همه محصولات ${icon('arrow_back')}</a>
      </div>
      <div class="public-category-tabs public-category-tabs--landing" data-landing-category-tabs><span class="skeleton-line"></span></div>
      <div class="public-product-grid pricing-grid public-product-grid--live" data-landing-product-grid><div class="public-catalog-loading"><span class="spinner"></span>در حال دریافت محصولات...</div></div>
    </section>

    <section id="features" class="tea-benefits-section landing-glass-panel landing-glass-panel--wide">
      <div class="tea-benefits-section__intro"><span class="tea-kicker tea-kicker--dark">${icon('auto_awesome')} تجربه‌ای ساده و قابل‌فهم</span><h2>همه‌چیز برای اینکه کمتر درگیر تنظیمات شوی و بیشتر بازی کنی.</h2><p>از خرید تا تمدید و پشتیبانی، هر چیزی که لازم داری در یک داشبورد مرتب در دسترس است.</p></div>
      <div class="tea-benefits-grid">
        <article>${icon('hourglass_top')}<h3>مدت‌های کوتاه و منعطف</h3><p>برای یک شب بازی، یک روز مسابقه یا استفاده دائمی، دوره مناسب خودت را انتخاب کن.</p></article>
        <article>${icon('payments')}<h3>خرید سریع با کیف پول</h3><p>موجودی را شارژ کن و بدون تکرار مراحل پرداخت، سرویس‌های بعدی را سریع‌تر بخر.</p></article>
        <article>${icon('notifications_active')}<h3>زمان باقی‌مانده روشن</h3><p>تاریخ پایان سرویس، تمدید خودکار و وضعیت پرداخت همیشه واضح نمایش داده می‌شود.</p></article>
        <article>${icon('forum')}<h3>پشتیبانی کنار سرویس</h3><p>تیکت بساز، فایل بفرست و پاسخ‌ها را همان‌جا در یک گفت‌وگوی مرتب دنبال کن.</p></article>
      </div>
    </section>

    <section class="tea-quote-section landing-glass-panel">
      <div class="tea-quote-section__mark">${icon('format_quote')}</div>
      <div><span>فلسفه ابر چایی</span><h2>قرار نیست برای چند ساعت استفاده، هزینه یک ماه را بپردازی.</h2><p>سرویس ابری یعنی انتخاب آزادانه مدت، ظرفیت و زمان شروع؛ درست همان لحظه‌ای که نیازش داری.</p></div>
    </section>

    <section class="tea-cta-section landing-glass-panel landing-glass-panel--accent">
      <div><span>${icon('local_cafe')} آماده‌ای؟</span><h2>چایت را بریز و سرورت را روشن کن.</h2><p>حساب بساز، کیف پولت را شارژ کن و اولین سرویس را با مدت دلخواه بگیر.</p></div>
      <a data-link data-dashboard-access href="/auth" class="button button--light button--large">ورود به ابر چایی ${icon('arrow_back')}</a>
    </section>
    <button type="button" class="landing-back-to-top" data-landing-back-to-top aria-label="بازگشت به بالای صفحه" title="بازگشت به بالا">${icon('arrow_upward')}</button>
  `, { transparent: true });
  startLandingCreature();
  bindLandingBackToTop();
  void hydrateLandingProducts(version);
  void probeBackendAvailability(apiBaseUrl).then(() => syncBackendAvailabilityUi());
}

export async function renderPublicProducts(): Promise<void> {
  stopLandingCategoryRotation();
  renderPublic(`
    <section class="public-page-hero public-page-hero--products">
      <span class="tea-kicker">${icon('shopping_bag')} فهرست عمومی محصولات</span>
      <h1>سرویس مناسب زمان و جمع خودت را پیدا کن.</h1>
      <p>همه دسته‌ها و محصولات فعال را یک‌جا ببین؛ سپس برای خرید و راه‌اندازی وارد داشبورد شو.</p>
    </section>
    <section class="public-products-page">
      <div class="public-category-tabs public-category-tabs--page" data-public-products-tabs><span class="skeleton-line"></span></div>
      <div class="public-products-overview" data-public-products-overview><div class="public-catalog-loading"><span class="spinner"></span>در حال دریافت همه محصولات...</div></div>
    </section>
    <section class="public-page-cta"><div><h2>مدت کوتاه می‌خواهی یا سرویس دائمی؟</h2><p>بعد از انتخاب محصول، تنظیم نهایی و راه‌اندازی از داشبورد انجام می‌شود.</p></div><a data-link data-dashboard-access href="/auth" class="button button--primary">ورود به داشبورد ${icon('arrow_back')}</a></section>
  `);

  const tabs = document.querySelector<HTMLElement>('[data-public-products-tabs]');
  const overview = document.querySelector<HTMLElement>('[data-public-products-overview]');
  if (!tabs || !overview) return;
  try {
    const categories = await getPublicCategories();
    const groups = await Promise.all(categories.map(async (category) => ({ category, products: await getPublicProducts(category.slug) })));
    tabs.innerHTML = categoryTabs(categories, '*', true);
    overview.innerHTML = groups.map(({ category, products }) => `<section class="public-product-category-group" data-public-product-group="${escapeHtml(category.slug)}"><header><div><span>${icon('category')} ${escapeHtml(category.name)}</span><h2>${escapeHtml(category.name)}</h2><p>${escapeHtml(category.description || 'محصولات فعال این دسته')}</p></div><b>${products.length.toLocaleString('fa-IR')} محصول</b></header><div class="pricing-grid public-product-grid--page">${products.map(publicProductCard).join('') || `<div class="public-catalog-state">${icon('inventory_2')}<div><b>محصولی در این دسته وجود ندارد</b><p>این دسته فعلاً محصول فعالی ندارد.</p></div></div>`}</div></section>`).join('') || `<div class="public-catalog-state">${icon('inventory_2')}<div><b>فهرست عمومی خالی است</b><p>هنوز دسته یا محصول فعالی منتشر نشده است.</p></div></div>`;

    qsa<HTMLButtonElement>('[data-public-category]', tabs).forEach((button) => button.addEventListener('click', () => {
      const selected = button.dataset.publicCategory || '*';
      qsa<HTMLButtonElement>('[data-public-category]', tabs).forEach((item) => item.classList.toggle('is-active', item === button));
      qsa<HTMLElement>('[data-public-product-group]', overview).forEach((group) => { group.hidden = selected !== '*' && group.dataset.publicProductGroup !== selected; });
    }));
  } catch (error) {
    tabs.innerHTML = '';
    overview.innerHTML = catalogError(error instanceof Error ? error.message : 'فهرست عمومی دریافت نشد.');
    overview.querySelector('[data-retry-public-catalog]')?.addEventListener('click', () => void renderPublicProducts());
  }
  void probeBackendAvailability(apiBaseUrl).then(() => syncBackendAvailabilityUi());
}

interface RulesContent {
  versionLabel: string;
  hero: { kicker: string; title: string; description: string };
  summary: { title: string; text: string; buttonLabel: string; buttonHref: string };
  items: Array<{ icon: string; title: string; text: string }>;
}

function isRulesContent(value: unknown): value is RulesContent {
  if (!value || typeof value !== 'object') return false;
  const root = value as Partial<RulesContent>;
  return typeof root.versionLabel === 'string'
    && Boolean(root.hero && typeof root.hero.title === 'string' && typeof root.hero.description === 'string')
    && Boolean(root.summary && typeof root.summary.title === 'string' && typeof root.summary.text === 'string')
    && Array.isArray(root.items);
}

export async function renderRules(): Promise<void> {
  stopLandingCategoryRotation();
  renderPublic(`<section class="public-page-hero public-page-hero--rules"><span class="tea-kicker">${icon('gavel')} قوانین استفاده</span><h1>در حال دریافت قوانین...</h1><p>متن قوانین از فایل قابل‌ویرایش سایت بارگذاری می‌شود.</p></section><section class="rules-page"><div class="skeleton-page"></div></section>`);
  try {
    const response = await fetch('/content/rules.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Rules content returned ${response.status}`);
    const raw: unknown = await response.json();
    if (!isRulesContent(raw)) throw new Error('ساختار فایل قوانین معتبر نیست.');
    const rules = raw;
    renderPublic(`
      <section class="public-page-hero public-page-hero--rules"><span class="tea-kicker">${icon('gavel')} ${escapeHtml(rules.hero.kicker)}</span><h1>${escapeHtml(rules.hero.title)}</h1><p>${escapeHtml(rules.hero.description)}</p></section>
      <section class="rules-page">
        <aside class="rules-page__summary"><span>${escapeHtml(rules.versionLabel)}</span><h2>${escapeHtml(rules.summary.title)}</h2><p>${escapeHtml(rules.summary.text)}</p><a data-link href="${escapeHtml(rules.summary.buttonHref)}" class="button button--secondary button--block">${escapeHtml(rules.summary.buttonLabel)}</a></aside>
        <div class="rules-list">${rules.items.map((rule, index) => `<article id="rule-${index + 1}"><span>${icon(rule.icon || 'article')}</span><div><small>بند ${index + 1}</small><h3>${escapeHtml(rule.title)}</h3><p>${escapeHtml(rule.text)}</p></div></article>`).join('')}</div>
      </section>
    `);
  } catch {
    renderPublic(`<section class="public-page-hero public-page-hero--rules"><span class="tea-kicker">${icon('gavel')} قوانین استفاده</span><h1>فایل قوانین در دسترس نیست.</h1><p>فایل <code dir="ltr">public/content/rules.json</code> را بررسی کنید و صفحه را دوباره بارگذاری کنید.</p></section><section class="public-page-cta"><div><h2>امکان نمایش قوانین وجود ندارد</h2><p>ساختار JSON باید شامل hero، summary و items باشد.</p></div><button class="button button--primary" onclick="location.reload()">تلاش دوباره</button></section>`);
  }
  void probeBackendAvailability(apiBaseUrl).then(() => syncBackendAvailabilityUi());
}
