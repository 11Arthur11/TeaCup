import { api, ApiError, backendMessage } from '../api/client.js';
import { fetchSessionProfile } from '../api/session-profile.js';
import { hasActiveAuthSession } from '../api/auth-session.js';
import { hasAdminPanelAccess } from '../core/authorization.js';
import { escapeHtml, icon, qs } from '../core/dom.js';
import { router } from '../core/router.js';
import { store } from '../core/store.js';
import { normalizeIranMobileInput } from '../core/phone.js';
import { notify } from '../core/toast.js';
import { renderPublic } from '../ui/layout.js';
import { markDashboardTourPendingAfterRegistration } from '../ui/dashboard-tour.js';

let stage: 'phone' | 'login' | 'register' = 'phone';
let phone = '';

const shell = (content: string): void => renderPublic(`<section class="auth-page"><div class="auth-visual"><div class="auth-visual__content"><span class="pill pill--light">${icon('space_dashboard')} همه‌چیز در یک داشبورد</span><h1>سرویس، کیف پول و پشتیبانی؛<br/>همه کنار هم.</h1><p>با ورود به ابر چایی، سرویس‌های فعال، زمان باقی‌مانده، پرداخت‌ها و گفتگوهای پشتیبانی را از یک صفحه مدیریت کنید.</p><div class="auth-feature">${icon('tune')}<span><b>کنترل سریع سرویس‌ها</b><small>شروع، توقف، تمدید و ویرایش بدون مسیرهای پیچیده</small></span></div><div class="auth-feature">${icon('account_balance_wallet')}<span><b>مدیریت مالی شفاف</b><small>موجودی، تراکنش‌ها و فاکتورها همیشه در دسترس شماست</small></span></div></div></div><div class="auth-panel"><a data-link class="auth-back" href="/">${icon('arrow_forward')} بازگشت به خانه</a><div class="auth-box">${content}</div></div></section>`);

export function renderAuth(): void {
  if (store.get().identity.status === 'authenticated') {
    router.navigate(hasAdminPanelAccess(store.get().identity.role) ? '/admin' : '/panel', true);
    return;
  }
  stage = 'phone'; renderPhone();
}

function renderPhone(): void {
  shell(`<div class="auth-heading"><span class="auth-icon">${icon('phone_iphone')}</span><h2>ورود یا ثبت‌نام</h2><p>شماره موبایل خود را وارد کنید تا کد تأیید ارسال شود.</p></div><form id="auth-form" class="auth-form"><label class="field"><span>شماره موبایل</span><input name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" dir="ltr" placeholder="09123456789" pattern="09[0-9]{9}" minlength="11" maxlength="11" aria-describedby="phone-help" required/><small id="phone-help">شماره را به‌صورت 09123456789 وارد کنید.</small></label><button type="submit" class="button button--primary button--block button--large">دریافت کد تأیید ${icon('arrow_back')}</button></form><p class="auth-legal">با ادامه، <a data-link href="/rules">قوانین استفاده</a> و حریم خصوصی ابر چایی را می‌پذیرید.</p>`);
  const phoneInput = qs<HTMLInputElement>('input[name="phone"]');
  phoneInput.addEventListener('input', () => {
    const normalized = normalizeIranMobileInput(phoneInput.value).replace(/\D/g, '').slice(0, 11);
    if (phoneInput.value !== normalized) phoneInput.value = normalized;
    phoneInput.setCustomValidity('');
  });
  qs<HTMLFormElement>('#auth-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const button = qs<HTMLButtonElement>('button[type="submit"]', form);
    phone = phoneInput.value;
    let backendPhone: string;
    try {
      const normalized = normalizeIranMobileInput(phone).replace(/\D/g, '');

      if (!/^09\d{9}$/.test(normalized)) {
        throw new Error('شماره موبایل معتبر نیست.');
      }

      backendPhone = normalized.substring(1);
    } catch (error) {
      phoneInput.setCustomValidity(error instanceof Error ? error.message : 'شماره موبایل معتبر نیست.');
      phoneInput.reportValidity();
      phoneInput.focus();
      return;
    }
    button.disabled = true; button.dataset.loading = 'true';
    try {
      const response = await api.call('authEntry', { body: { phoneNumber: backendPhone } });
      const payload = response as { type?: string; message?: string };
      if (payload.message) notify(payload.message, 'success');
      stage = payload.type === 'REGISTER_INITIATED' ? 'register' : 'login';
      stage === 'register' ? renderRegister() : renderLogin();
    } catch (error) { notify(error instanceof ApiError ? error.message : 'ارسال کد با خطا مواجه شد.', 'error'); }
    finally { button.disabled = false; delete button.dataset.loading; }
  });
}

function otpHeader(title: string, description: string): string {
  return `<button class="link-button auth-change-phone" id="change-phone">${icon('edit')} تغییر شماره</button><div class="auth-heading"><span class="auth-icon">${icon('sms')}</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)} <b dir="ltr">${escapeHtml(phone)}</b></p></div>`;
}

function bindChangePhone(): void { qs('#change-phone').addEventListener('click', () => { stage = 'phone'; renderPhone(); }); }

function renderLogin(): void {
  shell(`${otpHeader('کد تأیید را وارد کنید', 'کد یک‌بارمصرف برای این شماره ارسال شد:')}<form id="auth-form" class="auth-form"><label class="field"><span>کد تأیید</span><input name="otp" class="otp-input" inputmode="numeric" autocomplete="one-time-code" dir="ltr" maxlength="8" required/></label><label class="check-row"><input type="checkbox" name="rememberMe"/><span>${icon('check')}</span><em>مرا در این دستگاه به خاطر بسپار</em></label><button class="button button--primary button--block button--large">ورود به ابر چایی ${icon('login')}</button></form>`);
  bindChangePhone(); bindSubmit('login');
}

function renderRegister(): void {
  shell(`${otpHeader('تکمیل ثبت‌نام', 'برای ساخت حساب، اطلاعات خود و کد ارسال‌شده را وارد کنید:')}<form id="auth-form" class="auth-form"><div class="form-grid"><label class="field"><span>نام</span><input name="firstName" autocomplete="given-name" required/></label><label class="field"><span>نام خانوادگی</span><input name="lastName" autocomplete="family-name" required/></label></div><label class="field"><span>ایمیل <small>(اختیاری)</small></span><input name="email" type="email" autocomplete="email" dir="ltr"/></label><label class="field"><span>کد تأیید</span><input name="otp" class="otp-input" inputmode="numeric" autocomplete="one-time-code" dir="ltr" maxlength="8" required/></label><button class="button button--primary button--block button--large">ساخت حساب و ورود ${icon('person_add')}</button></form>`);
  bindChangePhone(); bindSubmit('register');
}

function bindSubmit(mode: 'login' | 'register'): void {
  qs<HTMLFormElement>('#auth-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = new FormData(form); const button = qs<HTMLButtonElement>('button[type="submit"], button:last-child', form);
    button.disabled = true; button.dataset.loading = 'true';
    try {
      const rememberMe = mode === 'login' && data.get('rememberMe') === 'on';
      const response = mode === 'login'
        ? await api.call('login', { body: { twoFactorCode: String(data.get('otp') ?? ''), rememberMe } })
        : await api.call('register', { body: { twoFactorCode: String(data.get('otp') ?? ''), firstName: String(data.get('firstName') ?? ''), lastName: String(data.get('lastName') ?? ''), email: String(data.get('email') ?? '') || undefined } });
      const payload = response as { type?: string };
      const message = backendMessage(response); if (message) notify(message, 'success');
      if (mode === 'register' && payload.type === 'REGISTER_SUCCESS') {
        await markDashboardTourPendingAfterRegistration();
      }

      const sessionActive = await hasActiveAuthSession();
      if (!sessionActive) throw new ApiError('ورود تأیید نشد. دوباره تلاش کنید.', 401);

      store.setIdentity({ status: 'checking', userId: null, role: null });
      try {
        store.setIdentity(await fetchSessionProfile());
        router.navigate(hasAdminPanelAccess(store.get().identity.role) ? '/admin' : '/panel', true);
      } catch (profileError) {
        if (!(profileError instanceof ApiError && profileError.status === 403)) {
          notify(profileError instanceof ApiError ? profileError.message : 'ورود انجام شد اما پروفایل و سطح دسترسی دریافت نشد.', 'error');
          router.navigate('/panel', true);
        }
      }
    } catch (error) { notify(error instanceof ApiError ? error.message : 'ورود انجام نشد.', 'error'); }
    finally { button.disabled = false; delete button.dataset.loading; }
  });
}
