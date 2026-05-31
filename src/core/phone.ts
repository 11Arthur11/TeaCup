const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * Converts Persian/Arabic digits to ASCII and removes common visual separators.
 * The returned value remains in Iran's local mobile format (09xxxxxxxxx).
 */
export function normalizeIranMobileInput(value: string): string {
  return value
    .trim()
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[\s()-]/g, '');
}

export function isValidIranMobile(value: string): boolean {
  return /^09\d{9}$/.test(normalizeIranMobileInput(value));
}

/** Converts 09xxxxxxxxx to the E.164 value expected by the backend: +989xxxxxxxxx. */
export function iranMobileToE164(value: string): string {
  const normalized = normalizeIranMobileInput(value);
  if (!/^09\d{9}$/.test(normalized)) {
    throw new Error('شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.');
  }
  return `+98${normalized.slice(1)}`;
}
