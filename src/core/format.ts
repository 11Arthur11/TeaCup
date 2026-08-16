import type { Money } from '../api/generated-models.js';

const numberFormatter = new Intl.NumberFormat('fa-IR');
const dateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
});
const compactDateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric', month: '2-digit', day: '2-digit'
});

export const faNumber = (value: number | string | null | undefined): string =>
  numberFormatter.format(Number(value ?? 0));

export const faDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
};

export const faDateShort = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : compactDateFormatter.format(date);
};


export const remainingTime = (value?: string | null): string => {
  if (!value) return 'زمان انقضا نامشخص';
  const expiration = new Date(value);
  if (Number.isNaN(expiration.getTime())) return 'زمان انقضا نامعتبر';
  const diff = expiration.getTime() - Date.now();
  if (diff <= 0) return 'منقضی شده';

  const totalMinutes = Math.max(1, Math.ceil(diff / 60_000));
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return hours > 0
    ? `${numberFormatter.format(days)} روز و ${numberFormatter.format(hours)} ساعت باقی مانده`
    : `${numberFormatter.format(days)} روز باقی مانده`;
  if (hours > 0) return minutes > 0
    ? `${numberFormatter.format(hours)} ساعت و ${numberFormatter.format(minutes)} دقیقه باقی مانده`
    : `${numberFormatter.format(hours)} ساعت باقی مانده`;
  return `${numberFormatter.format(minutes)} دقیقه باقی مانده`;
};

export const money = (value?: Money | null): string => {
  const amount = Number(value?.amount ?? 0);
  return `${numberFormatter.format(amount)} تومان`;
};

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Backend enums are intentionally transported as stable machine-readable values.
 * All user-facing translation belongs to this frontend registry.
 */
const enumLabels: Record<string, string> = {
  // Resource lifecycle
  ACTIVE: 'فعال',
  DEPLOYING: 'در حال راه‌اندازی',
  PENDING_PROLONG: 'در انتظار تمدید',
  LOCKED: 'قفل‌شده',

  // Query instance lifecycle
  DISABLED: 'غیرفعال',
  FULL: 'ظرفیت تکمیل',
  UNREACHABLE: 'غیرقابل دسترس',
  RECONNECTING: 'در حال اتصال مجدد',
  LOGIN_FAILED: 'ورود ناموفق',
  DISPATCHED: 'آماده سرویس‌دهی',
  INITIATED: 'راه‌اندازی اولیه',

  // TeaSpeak runtime
  ONLINE: 'آنلاین',
  OFFLINE: 'آفلاین',

  // Tickets
  PENDING: 'در انتظار',
  CLOSED: 'بسته',
  RESPONDED: 'پاسخ داده‌شده',
  WAITING: 'منتظر پاسخ',
  TECHNICAL: 'فنی',
  SALES: 'فروش',

  // Invoices and wallet
  PAID: 'پرداخت‌شده',
  CANCELLED: 'لغوشده',
  CREDIT: 'افزایش موجودی',
  DEBIT: 'کاهش موجودی',
  PROLONG: 'تمدید',
  PURCHASE: 'خرید',
  REFUND: 'بازگشت وجه',
  WALLET_CHARGE: 'شارژ کیف پول',

  // Products and resources
  TEASPEAK: 'سرور TeaSpeak',
  AUDIO_BOT: 'AudioBot',
  HOURLY: 'ساعتی',
  MONTHLY: 'ماهانه',
  DAILY: 'روزانه',
  BIMONTHLY: 'دوماهه',
  QUARTERLY: 'سه‌ماهه',
  SEMIANNUAL: 'شش‌ماهه',
  ANNUAL: 'سالانه',
  AQAYE_PARDAKHT: 'آقای پرداخت',
  IRT: 'تومان',

  // DNS provider and zone lifecycle
  CONNECTED: 'متصل',
  CONNECTING: 'در حال اتصال',
  API_KEY_REJECTED: 'کلید API رد شده',
  SERVER_ERROR: 'خطای Provider',
  UNKNOWN: 'نامشخص',
  CREATING: 'در حال ساخت',
  DELETING: 'در حال حذف',

  // Provisioning strategies
  BALANCED: 'متعادل',
  BIN_PACKING: 'تجمیع ظرفیت',
  RANDOMIZED: 'تصادفی',
  ROUND_ROBIN: 'چرخشی',

  // API response states
  SUCCESS: 'موفق',
  ERROR: 'خطا',
  PROCESSING: 'در حال پردازش',
  FAILURE: 'ناموفق',
  DATA: 'دارای داده',
  NO_DATA: 'بدون داده',

  // Authorization
  ROLE_USER: 'کاربر',
  ROLE_SUPPORT: 'کارشناس پشتیبانی',
  ROLE_ADMIN: 'مدیر سامانه',
};

const enumTones: Record<string, BadgeTone> = {
  // Healthy / ready
  ACTIVE: 'success',
  PAID: 'success',
  RESPONDED: 'success',
  ONLINE: 'success',
  SUCCESS: 'success',
  CREDIT: 'success',
  ROLE_ADMIN: 'success',
  DISPATCHED: 'success',
  ROUND_ROBIN: 'success',
  BALANCED: 'info',
  CONNECTED: 'success',
  CONNECTING: 'warning',
  CREATING: 'info',
  DELETING: 'warning',

  // Transitional / attention
  PENDING: 'warning',
  WAITING: 'warning',
  DEPLOYING: 'info',
  PENDING_PROLONG: 'warning',
  LOCKED: 'danger',
  PROCESSING: 'warning',
  ROLE_SUPPORT: 'warning',
  FULL: 'warning',
  RECONNECTING: 'warning',
  INITIATED: 'info',
  BIN_PACKING: 'warning',
  RANDOMIZED: 'info',

  // Failed / unavailable
  CANCELLED: 'danger',
  CLOSED: 'danger',
  OFFLINE: 'danger',
  ERROR: 'danger',
  FAILURE: 'danger',
  DEBIT: 'danger',
  UNREACHABLE: 'danger',
  LOGIN_FAILED: 'danger',
  API_KEY_REJECTED: 'danger',
  SERVER_ERROR: 'danger',

  // Intentionally disabled / informational
  DISABLED: 'neutral',
  ROLE_USER: 'info',
  DATA: 'info',
  NO_DATA: 'neutral',
  UNKNOWN: 'neutral',
};

export const translateEnum = (value?: string | null): string => {
  const normalized = value?.trim().toUpperCase();
  return normalized ? (enumLabels[normalized] ?? value?.trim() ?? '—') : '—';
};

export const statusTone = (value?: string | null): BadgeTone => {
  const normalized = value?.trim().toUpperCase();
  return normalized ? (enumTones[normalized] ?? 'info') : 'neutral';
};

export const resourceStatusHint = (value?: string | null): string => {
  switch (value?.trim().toUpperCase()) {
    case 'ACTIVE': return 'سرویس فعال است و دوره آن در حال استفاده است.';
    case 'DEPLOYING': return 'زیرساخت سرویس در حال Provisioning و آماده‌سازی است.';
    case 'PENDING_PROLONG': return 'دوره سرویس به پایان نزدیک شده یا منتظر تمدید است.';
    case 'LOCKED': return 'سرویس توسط مدیریت قفل شده و عملیات اجرایی آن غیرفعال است.';
    default: return 'آخرین وضعیت چرخه سرویس از backend دریافت شده است.';
  }
};

export const runtimeStatusHint = (value?: string | null): string => {
  switch (value?.trim().toUpperCase()) {
    case 'ONLINE': return 'سرور TeaSpeak روشن و آماده پذیرش اتصال است.';
    case 'OFFLINE': return 'سرور TeaSpeak خاموش است و می‌توانید آن را روشن کنید.';
    case 'DISPATCHED': return 'نود با موفقیت آماده سرویس‌دهی است.';
    case 'RECONNECTING': return 'ارتباط نود قطع شده و اتصال مجدد در حال انجام است.';
    case 'UNREACHABLE': return 'نود از سمت backend قابل دسترس نیست.';
    case 'LOGIN_FAILED': return 'احراز هویت نود با اطلاعات فعلی ناموفق بوده است.';
    case 'FULL': return 'ظرفیت تخصیص نود تکمیل شده است.';
    case 'DISABLED': return 'نود توسط مدیر غیرفعال شده است.';
    case 'INITIATED': return 'نود ایجاد شده و راه‌اندازی اولیه در حال انجام است.';
    default: return 'آخرین وضعیت runtime از backend دریافت شده است.';
  }
};
