import type * as Models from '../api/generated-models.js';
import { escapeHtml, icon } from '../core/dom.js';

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

export function renderProductPresentationPreview(title: string, presentation: ParsedProductPresentation): string {
  return `<article class="product-presentation-preview-card">
    ${renderProductBadges(presentation.badges, { max: 4 })}
    <h4>${escapeHtml(title || 'نام محصول')}</h4>
    <p>${escapeHtml(presentation.description || 'توضیح کوتاه محصول در این بخش نمایش داده می‌شود.')}</p>
    ${renderProductFeatures(presentation.features)}
  </article>`;
}

export interface ProductPresentationEditor {
  element: HTMLElement;
  getPresentation(): Models.ProductPresentation;
}

const defaultFeatures: ProductFeaturePresentation[] = [
  { text: 'راه‌اندازی خودکار', enabled: true },
  { text: 'مدیریت از داشبورد', enabled: true },
];

export function createProductPresentationEditor(
  initial: Models.ProductPresentation | undefined,
  productNameInput?: HTMLInputElement,
): ProductPresentationEditor {
  const parsed = parseProductPresentation(initial);
  const state: ParsedProductPresentation = {
    description: parsed.description,
    features: parsed.features.length ? parsed.features : [...defaultFeatures],
    badges: parsed.badges.length ? parsed.badges : [{ text: 'پیشنهاد ویژه', variant: 'primary' }],
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
    <section class="product-presentation-editor__preview"><header><span>${icon('visibility')} پیش‌نمایش زنده</span><small>نمای تقریبی کارت در پنل کاربر</small></header><div data-product-presentation-preview></div></section>`;

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
    preview.innerHTML = renderProductPresentationPreview(productNameInput?.value ?? '', state);
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
      featureList.querySelector<HTMLInputElement>('[data-product-feature-text]:last-of-type')?.focus();
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
    const badgeRow = target?.closest<HTMLElement>('[data-select-product-badge]');
    if (badgeRow && !target?.closest('[data-remove-product-badge]')) {
      activeBadgeIndex = Number(badgeRow.dataset.selectProductBadge);
      renderBadgeList();
      return;
    }
    const variantButton = target?.closest<HTMLButtonElement>('[data-product-badge-variant]');
    const activeBadge = state.badges[activeBadgeIndex];
    if (variantButton && activeBadge) {
      activeBadge.variant = variantButton.dataset.productBadgeVariant as ProductBadgeVariant;
      renderBadgeList();
      renderPreview();
    }
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

  productNameInput?.addEventListener('input', renderPreview);
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
