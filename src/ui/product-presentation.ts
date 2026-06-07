import type * as Models from '../api/generated-models.js';
import { escapeHtml, icon } from '../core/dom.js';
import { faNumber, money, translateEnum } from '../core/format.js';

export interface ProductFeaturePresentation {
  text: string;
  enabled: boolean;
}

export type ProductBadgeVariant =
  | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  | 'ocean' | 'violet' | 'sunset' | 'forest' | 'rose' | 'amber'
  | 'cyan' | 'indigo' | 'lime' | 'graphite' | 'aurora' | 'royal'
  | 'fire' | 'mint';

export interface ProductBadgePresentation {
  text: string;
  variant: ProductBadgeVariant;
}

export interface ParsedProductPresentation {
  description: string;
  features: ProductFeaturePresentation[];
  badges: ProductBadgePresentation[];
}

export interface ProductCardOptions {
  productName?: string;
  productType?: string;
  price?: Models.Money;
  period?: string;
  maxClients?: number;
  presentation: ParsedProductPresentation;
  productId?: number;
  actionLabel?: string;
  actionDisabled?: boolean;
}

export interface ProductPresentationPreviewFields {
  productNameInput?: HTMLInputElement;
  priceInput?: HTMLInputElement;
  periodInput?: HTMLSelectElement;
  productTypeInput?: HTMLSelectElement;
  maxClientsInput?: HTMLInputElement;
  initialPeriod?: string;
}

export const PRODUCT_BADGE_VARIANTS: ReadonlyArray<{ value: ProductBadgeVariant; label: string }> = [
  { value: 'primary', label: 'آبی اصلی' },
  { value: 'success', label: 'سبز موفقیت' },
  { value: 'warning', label: 'هشدار طلایی' },
  { value: 'danger', label: 'قرمز ویژه' },
  { value: 'info', label: 'آبی روشن' },
  { value: 'neutral', label: 'خنثی' },
  { value: 'ocean', label: 'اقیانوسی' },
  { value: 'violet', label: 'بنفش' },
  { value: 'sunset', label: 'غروب' },
  { value: 'forest', label: 'جنگلی' },
  { value: 'rose', label: 'رز' },
  { value: 'amber', label: 'کهربایی' },
  { value: 'cyan', label: 'فیروزه‌ای' },
  { value: 'indigo', label: 'نیلی' },
  { value: 'lime', label: 'لیمویی' },
  { value: 'graphite', label: 'گرافیتی' },
  { value: 'aurora', label: 'شفق' },
  { value: 'royal', label: 'سلطنتی' },
  { value: 'fire', label: 'آتشی' },
  { value: 'mint', label: 'نعنایی' },
] as const;

const badgeVariantSet = new Set<ProductBadgeVariant>(PRODUCT_BADGE_VARIANTS.map((item) => item.value));
const featuredBadgeVariants = new Set<ProductBadgeVariant>(['primary', 'royal', 'aurora', 'success']);

function parseJsonArray(value: string | undefined): unknown[] {
  if (!value?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizedProductType(value: string | undefined): 'TEASPEAK' | 'AUDIO_BOT' {
  return value?.includes('AUDIO') ? 'AUDIO_BOT' : 'TEASPEAK';
}

function fallbackDescription(options: ProductCardOptions): string {
  if (normalizedProductType(options.productType) === 'AUDIO_BOT') {
    return 'ربات موسیقی مدیریت‌شده با کنترل Playlist و اتصال پایدار';
  }
  return options.maxClients == null
    ? 'سرور TeaSpeak با راه‌اندازی سریع و مدیریت ساده از پنل ابر چایی'
    : `مناسب تیم‌ها و کامیونیتی‌ها با ظرفیت ${faNumber(options.maxClients)} کاربر`;
}

export function parseProductPresentation(presentation?: Models.ProductPresentation): ParsedProductPresentation {
  const features = parseJsonArray(presentation?.features).flatMap<ProductFeaturePresentation>((value) => {
    if (!isRecord(value) || typeof value.text !== 'string') return [];
    const text = value.text.trim();
    if (!text) return [];
    return [{ text, enabled: value.enabled !== false }];
  });

  const badges = parseJsonArray(presentation?.badges).flatMap<ProductBadgePresentation>((value) => {
    if (!isRecord(value) || typeof value.text !== 'string') return [];
    const text = value.text.trim();
    if (!text) return [];
    const variant = typeof value.variant === 'string' && badgeVariantSet.has(value.variant as ProductBadgeVariant)
      ? value.variant as ProductBadgeVariant
      : 'primary';
    return [{ text, variant }];
  });

  return {
    description: presentation?.description?.trim() ?? '',
    features,
    badges,
  };
}

export function serializeProductPresentation(value: ParsedProductPresentation): Models.ProductPresentation {
  const features = value.features
    .map((feature) => ({ text: feature.text.trim(), enabled: Boolean(feature.enabled) }))
    .filter((feature) => feature.text.length > 0);
  const badges = value.badges
    .map((badge) => ({ text: badge.text.trim(), variant: badge.variant }))
    .filter((badge) => badge.text.length > 0);
  return {
    description: value.description.trim(),
    features: JSON.stringify(features),
    badges: JSON.stringify(badges),
  };
}

export function renderProductBadges(
  badges: ProductBadgePresentation[],
  options: { compact?: boolean; max?: number } = {},
): string {
  const visible = badges.slice(0, options.max ?? badges.length);
  if (!visible.length) return '';
  return `<div class="product-presentation-badges ${options.compact ? 'product-presentation-badges--compact' : ''}">${visible.map((badge) => `<span class="product-presentation-badge product-presentation-badge--${badge.variant}">${escapeHtml(badge.text)}</span>`).join('')}</div>`;
}

export function renderProductFeatures(features: ProductFeaturePresentation[]): string {
  if (!features.length) return '';
  return `<ul class="product-presentation-features">${features.map((feature) => `<li class="${feature.enabled ? 'is-enabled' : 'is-disabled'}">${icon(feature.enabled ? 'check_circle' : 'cancel')}<span>${escapeHtml(feature.text)}</span></li>`).join('')}</ul>`;
}

/** Shared renderer used by the customer product list and the admin live preview. */
export function renderProductCard(options: ProductCardOptions): string {
  const productType = normalizedProductType(options.productType);
  const highlighted = options.presentation.badges.some((badge) => featuredBadgeVariants.has(badge.variant));
  const description = options.presentation.description || fallbackDescription(options);
  const priceText = money(options.price).replace(' تومان', '');
  const periodText = translateEnum(options.period || 'MONTHLY');
  const disabled = Boolean(options.actionDisabled);
  const buttonAttributes = disabled
    ? 'disabled aria-disabled="true"'
    : `data-buy-product="${Number(options.productId ?? 0)}" data-product-type="${productType}" data-product-name="${escapeHtml(options.productName)}"`;

  return `<article class="pricing-card pricing-card--presentation ${highlighted ? 'pricing-card--featured' : ''}">
    <div class="pricing-card__presentation-top">${renderProductBadges(options.presentation.badges, { max: 4 })}<div class="pricing-card__icon">${icon(productType === 'AUDIO_BOT' ? 'headphones' : 'dns')}</div></div>
    <h3>${escapeHtml(options.productName || 'نام محصول')}</h3>
    <p>${escapeHtml(description)}</p>
    <div class="pricing-card__price"><b>${priceText}</b><span>تومان / ${escapeHtml(periodText)}</span></div>
    ${renderProductFeatures(options.presentation.features)}
    <button type="button" class="button ${highlighted ? 'button--primary' : 'button--secondary'} button--block" ${buttonAttributes}>${escapeHtml(options.actionLabel || 'انتخاب و راه‌اندازی')} ${icon('arrow_back')}</button>
  </article>`;
}

export interface ProductPresentationEditor {
  element: HTMLElement;
  getPresentation(): Models.ProductPresentation;
}

export function createProductPresentationEditor(
  initial: Models.ProductPresentation | undefined,
  fields: ProductPresentationPreviewFields = {},
): ProductPresentationEditor {
  const parsed = parseProductPresentation(initial);
  const state: ParsedProductPresentation = {
    description: parsed.description,
    features: [...parsed.features],
    badges: [...parsed.badges],
  };
  let activeBadgeIndex = 0;

  const element = document.createElement('section');
  element.className = 'product-presentation-editor field--full';
  element.innerHTML = `<header class="product-presentation-editor__header"><div><span>نمایش و معرفی محصول</span><h3>محتوایی که مشتری در کارت محصول می‌بیند</h3><p>قابلیت‌ها و نشان‌ها به‌صورت JSON در رشته ذخیره می‌شوند و فقط توسط رابط کاربری تفسیر می‌شوند.</p></div><span class="product-presentation-editor__contract">UI contract v1</span></header>
    <label class="field field--full"><span>توضیح محصول</span><textarea name="presentationDescription" rows="3" maxlength="420" placeholder="توضیح کوتاه، روشن و فروش‌محور برای محصول"></textarea></label>
    <div class="product-presentation-editor__columns">
      <section class="product-presentation-builder"><header><div><b>قابلیت‌ها</b><small>علامت تیک یا ضربدر در کارت محصول</small></div><button type="button" class="button button--secondary button--small" data-add-product-feature>${icon('add')} افزودن</button></header><div data-product-feature-list></div></section>
      <section class="product-presentation-builder"><header><div><b>نشان‌ها</b><small>متن کوتاه همراه با استایل انتخابی</small></div><button type="button" class="button button--secondary button--small" data-add-product-badge>${icon('add')} افزودن</button></header><div data-product-badge-list></div><div class="product-badge-palette" data-product-badge-palette></div></section>
    </div>
    <section class="product-presentation-editor__preview"><header><span>${icon('visibility')} پیش‌نمایش زنده</span><small>همان کارت نهایی پنل کاربر؛ دکمه سفارش در پیش‌نمایش غیرفعال است</small></header><div data-product-presentation-preview></div></section>`;

  const descriptionInput = element.querySelector<HTMLTextAreaElement>('textarea[name="presentationDescription"]');
  if (!descriptionInput) throw new Error('ویرایشگر توضیح محصول ساخته نشد.');
  descriptionInput.value = state.description;

  const featureList = element.querySelector<HTMLElement>('[data-product-feature-list]');
  const badgeList = element.querySelector<HTMLElement>('[data-product-badge-list]');
  const palette = element.querySelector<HTMLElement>('[data-product-badge-palette]');
  const preview = element.querySelector<HTMLElement>('[data-product-presentation-preview]');
  if (!featureList || !badgeList || !palette || !preview) throw new Error('ویرایشگر معرفی محصول کامل ساخته نشد.');

  const renderPreview = (): void => {
    state.description = descriptionInput.value;
    const amount = Number(fields.priceInput?.value ?? 0);
    const productType = fields.productTypeInput?.value || 'TEASPEAK';
    const maxClients = Number(fields.maxClientsInput?.value ?? 0);
    preview.innerHTML = renderProductCard({
      productName: fields.productNameInput?.value,
      productType,
      price: { amount: Number.isFinite(amount) ? amount : 0, currency: 'IRT' },
      period: fields.periodInput?.value || fields.initialPeriod || 'MONTHLY',
      maxClients: maxClients > 0 ? maxClients : undefined,
      presentation: state,
      actionLabel: 'ثبت سفارش',
      actionDisabled: true,
    });
  };

  const renderPalette = (): void => {
    const activeVariant = state.badges[activeBadgeIndex]?.variant;
    palette.innerHTML = `<span>استایل نشان انتخاب‌شده</span><div>${PRODUCT_BADGE_VARIANTS.map((variant) => `<button type="button" class="product-badge-style-option ${variant.value === activeVariant ? 'is-active' : ''}" data-product-badge-variant="${variant.value}" title="${escapeHtml(variant.label)}"><span class="product-presentation-badge product-presentation-badge--${variant.value}">${escapeHtml(variant.label)}</span></button>`).join('')}</div>`;
  };

  const renderFeatureList = (): void => {
    featureList.innerHTML = state.features.length
      ? state.features.map((feature, index) => `<div class="product-editor-row product-editor-row--feature"><span class="product-editor-row__drag">${icon('drag_indicator')}</span><input type="text" value="${escapeHtml(feature.text)}" maxlength="90" placeholder="متن قابلیت" data-product-feature-text="${index}" /><label class="product-feature-state ${feature.enabled ? 'is-enabled' : 'is-disabled'}" title="فعال یا غیرفعال"><input type="checkbox" ${feature.enabled ? 'checked' : ''} data-product-feature-enabled="${index}" /><span>${icon(feature.enabled ? 'check' : 'close')}</span></label><button type="button" class="icon-button icon-button--danger" data-remove-product-feature="${index}" title="حذف قابلیت">${icon('delete')}</button></div>`).join('')
      : '<p class="product-editor-empty">هنوز قابلیتی اضافه نشده است.</p>';
  };

  const syncActiveBadgeUi = (): void => {
    badgeList.querySelectorAll<HTMLElement>('[data-select-product-badge]').forEach((row) => {
      row.classList.toggle('is-active', Number(row.dataset.selectProductBadge) === activeBadgeIndex);
    });
    renderPalette();
  };

  const activateBadge = (index: number): void => {
    if (!state.badges[index]) return;
    activeBadgeIndex = index;
    syncActiveBadgeUi();
  };

  const renderBadgeList = (): void => {
    if (activeBadgeIndex >= state.badges.length) activeBadgeIndex = Math.max(0, state.badges.length - 1);
    badgeList.innerHTML = state.badges.length
      ? state.badges.map((badge, index) => `<div class="product-editor-row product-editor-row--badge ${index === activeBadgeIndex ? 'is-active' : ''}" data-select-product-badge="${index}"><span class="product-presentation-badge product-presentation-badge--${badge.variant}">${escapeHtml(badge.text || 'نشان')}</span><input type="text" value="${escapeHtml(badge.text)}" maxlength="34" placeholder="مثلاً پرفروش" data-product-badge-text="${index}" /><button type="button" class="icon-button icon-button--danger" data-remove-product-badge="${index}" title="حذف نشان">${icon('delete')}</button></div>`).join('')
      : '<p class="product-editor-empty">هنوز نشانی اضافه نشده است.</p>';
    renderPalette();
  };

  const renderAll = (): void => {
    renderFeatureList();
    renderBadgeList();
    renderPreview();
  };

  element.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const addFeature = target?.closest<HTMLElement>('[data-add-product-feature]');
    if (addFeature) {
      if (state.features.length >= 12) return;
      state.features.push({ text: '', enabled: true });
      renderFeatureList();
      renderPreview();
      featureList.querySelector<HTMLInputElement>(`[data-product-feature-text="${state.features.length - 1}"]`)?.focus();
      return;
    }

    const addBadge = target?.closest<HTMLElement>('[data-add-product-badge]');
    if (addBadge) {
      if (state.badges.length >= 6) return;
      state.badges.push({ text: '', variant: 'primary' });
      activeBadgeIndex = state.badges.length - 1;
      renderBadgeList();
      renderPreview();
      badgeList.querySelector<HTMLInputElement>(`[data-product-badge-text="${activeBadgeIndex}"]`)?.focus();
      return;
    }

    const removeFeature = target?.closest<HTMLElement>('[data-remove-product-feature]');
    if (removeFeature) {
      state.features.splice(Number(removeFeature.dataset.removeProductFeature), 1);
      renderFeatureList();
      renderPreview();
      return;
    }

    const removeBadge = target?.closest<HTMLElement>('[data-remove-product-badge]');
    if (removeBadge) {
      state.badges.splice(Number(removeBadge.dataset.removeProductBadge), 1);
      renderBadgeList();
      renderPreview();
      return;
    }

    const variantButton = target?.closest<HTMLButtonElement>('[data-product-badge-variant]');
    const activeBadge = state.badges[activeBadgeIndex];
    if (variantButton && activeBadge) {
      activeBadge.variant = variantButton.dataset.productBadgeVariant as ProductBadgeVariant;
      const row = badgeList.querySelector<HTMLElement>(`[data-select-product-badge="${activeBadgeIndex}"]`);
      const chip = row?.querySelector<HTMLElement>('.product-presentation-badge');
      if (chip) chip.className = `product-presentation-badge product-presentation-badge--${activeBadge.variant}`;
      renderPalette();
      renderPreview();
      return;
    }

    const badgeRow = target?.closest<HTMLElement>('[data-select-product-badge]');
    if (badgeRow) activateBadge(Number(badgeRow.dataset.selectProductBadge));
  });

  element.addEventListener('focusin', (event) => {
    const input = (event.target as Element | null)?.closest<HTMLInputElement>('[data-product-badge-text]');
    if (input?.dataset.productBadgeText != null) activateBadge(Number(input.dataset.productBadgeText));
  });

  element.addEventListener('input', (event) => {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (input === descriptionInput) {
      renderPreview();
      return;
    }
    if (input.dataset.productFeatureText != null) {
      const feature = state.features[Number(input.dataset.productFeatureText)];
      if (feature) feature.text = input.value;
      renderPreview();
      return;
    }
    if (input.dataset.productBadgeText != null) {
      const badge = state.badges[Number(input.dataset.productBadgeText)];
      if (badge) badge.text = input.value;
      const chip = input.closest('.product-editor-row')?.querySelector<HTMLElement>('.product-presentation-badge');
      if (chip) chip.textContent = input.value || 'نشان';
      renderPreview();
    }
  });

  element.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    if (input.dataset.productFeatureEnabled == null) return;
    const index = Number(input.dataset.productFeatureEnabled);
    const feature = state.features[index];
    if (!feature) return;
    feature.enabled = input.checked;
    renderFeatureList();
    renderPreview();
  });

  const previewFields: Array<HTMLInputElement | HTMLSelectElement | undefined> = [
    fields.productNameInput,
    fields.priceInput,
    fields.periodInput,
    fields.productTypeInput,
    fields.maxClientsInput,
  ];
  previewFields.forEach((field) => {
    field?.addEventListener('input', renderPreview);
    field?.addEventListener('change', renderPreview);
  });

  renderAll();

  return {
    element,
    getPresentation: () => serializeProductPresentation({
      description: descriptionInput.value,
      features: state.features,
      badges: state.badges,
    }),
  };
}
