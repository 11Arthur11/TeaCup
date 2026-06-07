import { renderPublic, syncBackendAvailabilityUi } from '../ui/layout.js';
import { apiBaseUrl } from '../api/client.js';
import { probeBackendAvailability } from '../core/backend-availability.js';
import { brandLogo, escapeHtml, icon } from '../core/dom.js';

interface PublicProductMock {
  name: string;
  type: 'TeaSpeak' | 'AudioBot';
  duration: string;
  capacity: string;
  description: string;
  icon: string;
  featured?: boolean;
}

const publicProductsMock: PublicProductMock[] = [
  {
    name: 'TeaSpeak ساعتی',
    type: 'TeaSpeak',
    duration: 'شروع از ۱ ساعت',
    capacity: '۳۲ کاربر',
    description: 'برای یک بازی کوتاه، دورهمی یا تست سریع؛ فقط به‌اندازه زمانی که نیاز دارید.',
    icon: 'mic',
    featured: true,
  },
  {
    name: 'TeaSpeak روزانه',
    type: 'TeaSpeak',
    duration: 'شروع از ۱ روز',
    capacity: '۶۴ کاربر',
    description: 'انتخاب مناسب برای رویدادها، مسابقه‌ها و جمع‌های چندساعته یا یک‌روزه.',
    icon: 'groups',
  },
  {
    name: 'TeaSpeak ماهانه',
    type: 'TeaSpeak',
    duration: 'تمدید ماهانه',
    capacity: '۱۲۸ کاربر',
    description: 'برای تیم‌ها و کامیونیتی‌هایی که یک فضای صوتی همیشگی و قابل مدیریت می‌خواهند.',
    icon: 'dns',
  },
  {
    name: 'AudioBot روزانه',
    type: 'AudioBot',
    duration: 'پخش ۲۴ ساعته',
    capacity: 'Playlist نامحدود',
    description: 'موزیک و محتوای صوتی را در کانال خود پخش و فهرست‌های پخش را مدیریت کنید.',
    icon: 'headphones',
  },
];

function productCards(limit?: number): string {
  return publicProductsMock.slice(0, limit).map((product) => `<article class="public-product-card ${product.featured ? 'public-product-card--featured' : ''}">
    <div class="public-product-card__top"><span class="public-product-card__icon">${icon(product.icon)}</span><span class="public-product-card__mock">نمونه نمایشی</span></div>
    <div><small>${escapeHtml(product.type)}</small><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.description)}</p></div>
    <div class="public-product-card__facts"><span>${icon('schedule')} ${escapeHtml(product.duration)}</span><span>${icon('group')} ${escapeHtml(product.capacity)}</span></div>
    <a data-link data-dashboard-access href="/auth" class="public-product-card__action">انتخاب در داشبورد ${icon('arrow_back')}</a>
  </article>`).join('');
}

export function renderLanding(): void {
  renderPublic(`
    <section class="tea-hero">
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
            <article class="tea-float-card tea-float-card--service">${icon('graphic_eq')}<div><b>TeaSpeak آماده است</b><small>فعال تا ۵ ساعت دیگر</small></div></article>
            <article class="tea-float-card tea-float-card--wallet">${icon('account_balance_wallet')}<div><b>کیف پول شما</b><small>آماده خرید بعدی</small></div></article>
            <article class="tea-float-card tea-float-card--period">${icon('schedule')}<div><b>مدت دلخواه</b><small>ساعتی، روزانه یا ماهانه</small></div></article>
          </div>
        </div>
      </div>
    </section>

    <section class="tea-story-strip">
      <div><span>۱</span><b>کیف پول را شارژ کن</b><small>یک‌بار پرداخت، خریدهای بعدی سریع‌تر</small></div>
      <i>${icon('arrow_back')}</i>
      <div><span>۲</span><b>مدت را انتخاب کن</b><small>از چند ساعت تا دوره‌های بلندتر</small></div>
      <i>${icon('arrow_back')}</i>
      <div><span>۳</span><b>سرویس را تحویل بگیر</b><small>مشخصات اتصال در داشبورد شما</small></div>
    </section>

    <section id="products" class="public-products-section">
      <div class="public-section-heading public-section-heading--split">
        <div><span>محصولات پیشنهادی</span><h2>همان‌قدر بخر که استفاده می‌کنی</h2><p>این محصولات فعلاً نمونه نمایشی‌اند و پس از آماده‌شدن فهرست عمومی، اطلاعات واقعی جایگزین می‌شود.</p></div>
        <a data-link href="/products" class="button button--secondary">همه محصولات ${icon('arrow_back')}</a>
      </div>
      <div class="public-product-grid">${productCards(3)}</div>
    </section>

    <section id="features" class="tea-benefits-section">
      <div class="tea-benefits-section__intro"><span class="tea-kicker tea-kicker--dark">${icon('auto_awesome')} تجربه‌ای ساده و قابل‌فهم</span><h2>همه‌چیز برای اینکه کمتر درگیر تنظیمات شوی و بیشتر بازی کنی.</h2><p>از خرید تا تمدید و پشتیبانی، هر چیزی که لازم داری در یک داشبورد مرتب در دسترس است.</p></div>
      <div class="tea-benefits-grid">
        <article>${icon('hourglass_top')}<h3>مدت‌های کوتاه و منعطف</h3><p>برای یک شب بازی، یک روز مسابقه یا استفاده دائمی، دوره مناسب خودت را انتخاب کن.</p></article>
        <article>${icon('payments')}<h3>خرید سریع با کیف پول</h3><p>موجودی را شارژ کن و بدون تکرار مراحل پرداخت، سرویس‌های بعدی را سریع‌تر بخر.</p></article>
        <article>${icon('notifications_active')}<h3>زمان باقی‌مانده روشن</h3><p>تاریخ پایان سرویس، تمدید خودکار و وضعیت پرداخت همیشه واضح نمایش داده می‌شود.</p></article>
        <article>${icon('forum')}<h3>پشتیبانی کنار سرویس</h3><p>تیکت بساز، فایل بفرست و پاسخ‌ها را همان‌جا در یک گفت‌وگوی مرتب دنبال کن.</p></article>
      </div>
    </section>

    <section class="tea-quote-section">
      <div class="tea-quote-section__mark">${icon('format_quote')}</div>
      <div><span>فلسفه ابر چایی</span><h2>قرار نیست برای چند ساعت استفاده، هزینه یک ماه را بپردازی.</h2><p>سرویس ابری یعنی انتخاب آزادانه مدت، ظرفیت و زمان شروع؛ درست همان لحظه‌ای که نیازش داری.</p></div>
    </section>

    <section class="tea-cta-section">
      <div><span>${icon('local_cafe')} آماده‌ای؟</span><h2>چایت را بریز و سرورت را روشن کن.</h2><p>حساب بساز، کیف پولت را شارژ کن و اولین سرویس را با مدت دلخواه بگیر.</p></div>
      <a data-link data-dashboard-access href="/auth" class="button button--light button--large">ورود به ابر چایی ${icon('arrow_back')}</a>
    </section>
  `, { transparent: true });
  void probeBackendAvailability(apiBaseUrl).then(() => syncBackendAvailabilityUi());
}

export function renderPublicProducts(): void {
  renderPublic(`
    <section class="public-page-hero public-page-hero--products">
      <span class="tea-kicker">${icon('shopping_bag')} فهرست عمومی محصولات</span>
      <h1>سرویس مناسب زمان و جمع خودت را پیدا کن.</h1>
      <p>فهرست زیر فعلاً برای طراحی و تجربه کاربری به‌صورت نمایشی ساخته شده است. قیمت و موجودی واقعی بعداً از فهرست عمومی محصولات دریافت می‌شود.</p>
    </section>
    <section class="public-products-page">
      <div class="public-product-page-note">${icon('info')} اطلاعات این صفحه نمونه است و برای خرید نهایی باید وارد داشبورد شوید.</div>
      <div class="public-product-grid public-product-grid--page">${productCards()}</div>
    </section>
    <section class="public-page-cta"><div><h2>مدت کوتاه می‌خواهی یا سرویس دائمی؟</h2><p>در داشبورد می‌توانی دوره و ظرفیت مناسب را دقیق‌تر انتخاب کنی.</p></div><a data-link data-dashboard-access href="/auth" class="button button--primary">ورود به داشبورد ${icon('arrow_back')}</a></section>
  `);
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

