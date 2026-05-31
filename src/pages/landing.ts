import { renderPublic, syncBackendAvailabilityUi } from '../ui/layout.js';
import { apiBaseUrl } from '../api/client.js';
import { probeBackendAvailability } from '../core/backend-availability.js';
import { brandLogo, icon } from '../core/dom.js';

export function renderLanding(): void {
  renderPublic(`
    <section class="hero">
      <div class="hero__glow hero__glow--one"></div><div class="hero__glow hero__glow--two"></div>
      <div class="hero__content">
        <div class="hero__copy"><span class="pill">${icon('verified')} زیرساخت صوتی حرفه‌ای و مدیریت‌شده</span>
          <h1>صدای پایدار،<br/><em>مدیریت ابری ساده.</em></h1>
          <p>ابر چایی پلتفرم یکپارچه خرید، راه‌اندازی و مدیریت سرورهای TeaSpeak و سرویس‌های AudioBot است؛ با تمدید خودکار، صورتحساب شفاف و پشتیبانی فارسی.</p>
          <div class="hero__actions"><a data-link data-dashboard-access href="/auth" class="button button--primary button--large">شروع استفاده ${icon('arrow_back')}</a><a href="#services" class="button button--glass button--large">مشاهده سرویس‌ها</a></div>
          <div class="trust-row"><div><b>راه‌اندازی سریع</b><span>Provisioning خودکار</span></div><div><b>مدیریت متمرکز</b><span>از یک پنل واحد</span></div><div><b>پشتیبانی فارسی</b><span>فنی و فروش</span></div></div>
        </div>
        <div class="hero__visual" aria-label="نمای پنل ابر چایی">
          <div class="dashboard-preview">
            <div class="preview-sidebar"><span class="preview-logo">${brandLogo('preview-logo__image')}</span>${['dashboard','dns','headphones','receipt_long','support_agent'].map((name, i) => `<i class="${i === 0 ? 'active' : ''}">${icon(name)}</i>`).join('')}</div>
            <div class="preview-main"><div class="preview-top"><span></span><div><i></i><i></i><i></i></div></div><div class="preview-stats"><article><span>سرویس‌های فعال</span><b>۱۲</b><small>+۲ این ماه</small></article><article><span>مصرف منابع</span><b>۶۸٪</b><small>وضعیت پایدار</small></article><article><span>کیف پول</span><b>۲۴۵,۰۰۰</b><small>تومان</small></article></div><div class="preview-chart"><div class="chart-grid"></div><svg viewBox="0 0 600 180" preserveAspectRatio="none"><path d="M0,145 C70,130 90,90 150,105 S250,150 310,80 S430,20 600,55" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M0,145 C70,130 90,90 150,105 S250,150 310,80 S430,20 600,55 L600,180 L0,180 Z" fill="currentColor" opacity=".08"/></svg></div><div class="preview-list">${['TeaSpeak تهران — ۶۴ اسلات','AudioBot موزیک روم','TeaSpeak گیمینگ'].map((text, i) => `<div><span class="dot dot--${i === 1 ? 'warning' : 'success'}"></span><b>${text}</b><em>${i === 1 ? 'در حال اتصال' : 'فعال'}</em></div>`).join('')}</div></div>
          </div>
          <div class="floating-card floating-card--status">${icon('check_circle')}<div><b>سرویس آماده شد</b><span>در کمتر از یک دقیقه</span></div></div>
          <div class="floating-card floating-card--audio">${icon('graphic_eq')}<div><b>AudioBot آنلاین</b><span>پخش بدون وقفه</span></div></div>
        </div>
      </div>
      <div class="hero__logos"><span>زیرساخت سازگار با</span><b>TeaSpeak</b><b>AudioBot</b><b>پرداخت امن</b><b>DNS ابری</b></div>
    </section>

    <section id="services" class="section services-section"><div class="section-heading"><span>محصولات ابر چایی</span><h2>همه‌چیز برای یک تجربه صوتی حرفه‌ای</h2><p>سرویس‌ها با معماری مقیاس‌پذیر، کنترل کامل و تجربه کاربری یکپارچه ارائه می‌شوند.</p></div>
      <div class="service-grid">
        <article class="service-card service-card--primary"><div class="service-card__icon">${icon('dns')}</div><span class="service-tag">محبوب</span><h3>سرور TeaSpeak</h3><p>سرور صوتی پایدار با انتخاب ظرفیت، راه‌اندازی خودکار، کنترل روشن/خاموش و ساخت کلید دسترسی.</p><ul><li>${icon('check')} مدیریت وضعیت لحظه‌ای</li><li>${icon('check')} تمدید دستی یا خودکار</li><li>${icon('check')} ظرفیت‌های متنوع</li></ul><a data-link data-dashboard-access href="/auth">مشاهده پلن‌ها ${icon('arrow_back')}</a></article>
        <article class="service-card"><div class="service-card__icon">${icon('headphones')}</div><h3>سرویس AudioBot</h3><p>ربات صوتی همیشه‌فعال با اتصال به سرور، مدیریت Playlist و افزودن Track از لینک.</p><ul><li>${icon('check')} مدیریت Playlistها</li><li>${icon('check')} ویرایش اتصال و نام ربات</li><li>${icon('check')} کنترل اجرای سرویس</li></ul><a data-link data-dashboard-access href="/auth">ساخت AudioBot ${icon('arrow_back')}</a></article>
        <article class="service-card"><div class="service-card__icon">${icon('support_agent')}</div><h3>مدیریت و پشتیبانی</h3><p>صورتحساب، کیف پول، اعلان‌های سیستمی و تیکت‌های فنی و فروش در یک فضای شفاف.</p><ul><li>${icon('check')} پیگیری گفتگوها و فایل‌ها</li><li>${icon('check')} تاریخچه تراکنش‌ها</li><li>${icon('check')} پرداخت آنلاین امن</li></ul><a data-link data-dashboard-access href="/auth">ورود به پنل ${icon('arrow_back')}</a></article>
      </div>
    </section>

    <section id="features" class="section feature-section"><div class="feature-copy"><span class="eyebrow">کنترل کامل</span><h2>پنلی که برای مدیریت سرویس ساخته شده، نه فقط نمایش اطلاعات</h2><p>از خرید و Provisioning تا تمدید، پرداخت و پشتیبانی، تمام چرخه عمر سرویس در ابر چایی مدیریت می‌شود.</p><div class="feature-list"><div>${icon('bolt')}<span><b>عملیات سریع</b><small>شروع، توقف، تمدید و ویرایش در چند کلیک</small></span></div><div>${icon('security')}<span><b>احراز هویت امن</b><small>ورود OTP و مدیریت session توسط backend</small></span></div><div>${icon('monitoring')}<span><b>دید مدیریتی</b><small>آمار زنده، فیلتر و وضعیت منابع</small></span></div><div>${icon('devices')}<span><b>تجربه پاسخ‌گو</b><small>بهینه برای موبایل، تبلت و دسکتاپ</small></span></div></div></div><div class="feature-orbit"><div class="orbit orbit--1"></div><div class="orbit orbit--2"></div><div class="orbit-center">${brandLogo('orbit-center__logo')}<b>TeaCloud</b><span>مرکز کنترل</span></div>${[['dns','TeaSpeak'],['headphones','AudioBot'],['payments','پرداخت'],['support_agent','پشتیبانی']].map(([i,t],n)=>`<div class="orbit-item orbit-item--${n+1}">${icon(i ?? '')}<span>${t ?? ''}</span></div>`).join('')}</div></section>

    <section id="pricing" class="section cta-section"><div><span class="pill pill--light">آماده برای شروع؟</span><h2>زیرساخت صوتی خود را همین امروز راه‌اندازی کنید.</h2><p>پلن مناسب را انتخاب کنید و مدیریت حرفه‌ای سرویس را به ابر چایی بسپارید.</p></div><a data-link data-dashboard-access href="/auth" class="button button--light button--large">ساخت حساب و ورود ${icon('arrow_back')}</a></section>
  `, { transparent: true });
  void probeBackendAvailability(apiBaseUrl).then(() => syncBackendAvailabilityUi());
}
