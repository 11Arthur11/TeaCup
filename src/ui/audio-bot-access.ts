import { api, ApiError } from '../api/client.js';
import { dataOf } from '../api/data.js';
import { openDialog } from '../core/dialog.js';
import { escapeHtml, icon, qs, qsa } from '../core/dom.js';
import { faDate } from '../core/format.js';
import { notify } from '../core/toast.js';

interface AudioBotPanelAccessState {
  panelAddress: string;
  panelUrl?: string;
  credentials: string;
  validUntil?: string;
}

const panelAccessCache = new Map<number, AudioBotPanelAccessState>();

function safePanelUrl(value?: string): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function cachedAccess(resourceId: number): AudioBotPanelAccessState | undefined {
  const cached = panelAccessCache.get(resourceId);
  if (!cached) return undefined;
  if (!cached.validUntil) return cached;
  const expiresAt = Date.parse(cached.validUntil);
  if (!Number.isFinite(expiresAt) || expiresAt > Date.now()) return cached;
  panelAccessCache.delete(resourceId);
  return undefined;
}

function accessErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'دریافت دسترسی پنل AudioBot با خطا مواجه شد.';
}

function accessError(error: unknown): string {
  return `<div class="notice notice--warning">${icon('warning')}<span>${escapeHtml(accessErrorMessage(error))}</span></div>`;
}

async function copyPanelValue(value: string, label: string): Promise<void> {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    notify(`${label} کپی شد.`, 'success');
  } catch {
    notify(`کپی خودکار ${label} انجام نشد؛ مقدار را به‌صورت دستی انتخاب کنید.`, 'warning');
  }
}

function lockedAccessFields(): string {
  return `<div class="audio-bot-panel-card__field">
    <span>${icon('language')}<small>آدرس پنل</small></span>
    <div class="audio-bot-panel-card__masked ltr">https://panel.teacloud.example/access</div>
  </div>
  <div class="audio-bot-panel-card__field">
    <span>${icon('key')}<small>Credentials</small></span>
    <code class="audio-bot-panel-card__masked ltr">TC-••••••••-••••••••</code>
  </div>`;
}

function revealedAccessFields(access: AudioBotPanelAccessState): string {
  const address = access.panelAddress || 'آدرس پنل دریافت نشد';
  const addressValue = access.panelAddress.trim();
  const credentialValue = access.credentials.trim();
  return `<div class="audio-bot-panel-card__field">
    <span>${icon('language')}<small>آدرس پنل</small></span>
    <div class="audio-bot-panel-card__value-row">
      ${access.panelUrl
        ? `<a class="audio-bot-panel-card__url ltr" href="${escapeHtml(access.panelUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(address)} ${icon('open_in_new')}</a>`
        : `<code class="audio-bot-panel-card__plain-value ltr">${escapeHtml(address)}</code>`}
      ${addressValue ? `<button type="button" class="icon-button" data-copy-audio-bot-panel-url aria-label="کپی آدرس پنل">${icon('content_copy')}</button>` : ''}
    </div>
  </div>
  <div class="audio-bot-panel-card__field">
    <span>${icon('key')}<small>Credentials</small></span>
    <div class="audio-bot-panel-card__value-row">
      <code class="audio-bot-panel-card__plain-value ltr">${escapeHtml(credentialValue || 'Credentials دریافت نشد')}</code>
      ${credentialValue ? `<button type="button" class="icon-button" data-copy-audio-bot-panel-credentials aria-label="کپی Credentials">${icon('content_copy')}</button>` : ''}
    </div>
  </div>`;
}

function metaMarkup(access?: AudioBotPanelAccessState): string {
  return `<span class="audio-bot-panel-card__meta" data-audio-bot-panel-meta ${access ? '' : 'hidden'}>${icon('schedule')}<span>اعتبار:</span><b data-audio-bot-panel-valid-until>${access?.validUntil ? faDate(access.validUntil) : '—'}</b></span>`;
}

function bindCopyActions(card: HTMLElement, access: AudioBotPanelAccessState): void {
  card.querySelector<HTMLButtonElement>('[data-copy-audio-bot-panel-url]')?.addEventListener('click', () => {
    void copyPanelValue(access.panelAddress, 'آدرس پنل');
  });
  card.querySelector<HTMLButtonElement>('[data-copy-audio-bot-panel-credentials]')?.addEventListener('click', () => {
    void copyPanelValue(access.credentials, 'Credentials پنل');
  });
}

function revealCard(card: HTMLElement, access: AudioBotPanelAccessState): void {
  const accessBox = card.querySelector<HTMLElement>('[data-audio-bot-panel-access]');
  const meta = card.querySelector<HTMLElement>('[data-audio-bot-panel-meta]');
  const validUntil = card.querySelector<HTMLElement>('[data-audio-bot-panel-valid-until]');
  if (!accessBox || !meta || !validUntil) return;
  accessBox.classList.remove('is-locked');
  accessBox.classList.add('is-revealed');
  accessBox.innerHTML = revealedAccessFields(access);
  validUntil.textContent = access.validUntil ? faDate(access.validUntil) : '—';
  meta.hidden = false;
  bindCopyActions(card, access);
}

export function audioBotPanelAccessCard(resourceId: number, resourceLabel = 'AudioBot'): string {
  const access = cachedAccess(resourceId);
  return `<section class="card audio-bot-panel-card" data-audio-bot-panel-card data-resource-id="${resourceId}" data-resource-label="${escapeHtml(resourceLabel)}">
    <header class="card__header audio-bot-panel-card__header">
      <div>${icon('dashboard')}<h2>پنل اختصاصی AudioBot</h2>${metaMarkup(access)}</div>
      <button type="button" class="button button--secondary button--small" data-audio-bot-panel-load>${icon(access ? 'refresh' : 'visibility')} ${access ? 'دریافت دسترسی جدید' : 'نمایش دسترسی'}</button>
    </header>
    <div class="card__body audio-bot-panel-card__body">
      <div class="audio-bot-panel-card__intro">
        <span class="audio-bot-panel-card__icon">${icon('shield_lock')}</span>
        <div><b>دسترسی موقت پنل مدیریت ربات</b><p>آدرس پنل و Credentials فقط هنگام درخواست نمایش داده می‌شوند و می‌توانید آن‌ها را مستقیماً کپی یا باز کنید.</p></div>
      </div>
      <div class="audio-bot-panel-card__access ${access ? 'is-revealed' : 'is-locked'}" data-audio-bot-panel-access>
        ${access ? revealedAccessFields(access) : lockedAccessFields()}
      </div>
      <div class="audio-bot-panel-card__message" data-audio-bot-panel-message></div>
    </div>
  </section>`;
}

export function bindAudioBotPanelAccessCards(root: ParentNode = document): void {
  qsa<HTMLElement>('[data-audio-bot-panel-card]', root).forEach((card) => {
    const button = card.querySelector<HTMLButtonElement>('[data-audio-bot-panel-load]');
    if (!button || button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';

    const initialResourceId = Number(card.dataset.resourceId ?? 0);
    const initialAccess = Number.isInteger(initialResourceId) && initialResourceId > 0 ? cachedAccess(initialResourceId) : undefined;
    if (initialAccess) bindCopyActions(card, initialAccess);

    button.addEventListener('click', async () => {
      const resourceId = Number(card.dataset.resourceId ?? 0);
      if (!Number.isInteger(resourceId) || resourceId <= 0) {
        notify('شناسه AudioBot معتبر نیست.', 'error');
        return;
      }

      const message = card.querySelector<HTMLElement>('[data-audio-bot-panel-message]');
      if (!message) return;

      button.disabled = true;
      button.innerHTML = `${icon('progress_activity')} در حال دریافت...`;
      message.innerHTML = '';

      try {
        const response = await api.call('getPanelAccess', { path: { resourceId } });
        const responseData = dataOf(response);
        const state: AudioBotPanelAccessState = {
          panelAddress: responseData?.panelAddress?.trim() || '',
          panelUrl: safePanelUrl(responseData?.panelAddress),
          credentials: responseData?.token?.credentials?.trim() || '',
          validUntil: responseData?.token?.validUntil,
        };
        panelAccessCache.set(resourceId, state);
        revealCard(card, state);
        button.innerHTML = `${icon('refresh')} دریافت دسترسی جدید`;
      } catch (error) {
        message.innerHTML = accessError(error);
        button.innerHTML = `${icon('refresh')} تلاش دوباره`;
      } finally {
        button.disabled = false;
      }
    });
  });
}

export function openAudioBotPanelAccess(resourceId: number, resourceLabel = 'AudioBot'): void {
  const dialog = openDialog({
    title: 'پنل اختصاصی AudioBot',
    description: `دسترسی موقت پنل برای ${resourceLabel}`,
    content: '<div class="dialog-loading"><span class="spinner"></span>در حال دریافت دسترسی پنل...</div>',
    compact: true,
    hideFooter: true,
  });

  void (async () => {
    try {
      const response = await api.call('getPanelAccess', { path: { resourceId } });
      const access = dataOf(response);
      const panelUrl = safePanelUrl(access?.panelAddress);
      const panelAddress = access?.panelAddress?.trim() || '';
      const credentials = access?.token?.credentials?.trim() || '';
      const content = qs<HTMLElement>('.dialog__content', dialog);
      if (!dialog.open) return;

      content.innerHTML = `<div class="audio-bot-access">
        <div class="audio-bot-access__item">
          <span>${icon('open_in_new')}<small>آدرس پنل</small></span>
          <div class="audio-bot-access__credential-row">
            ${panelUrl
              ? `<a class="audio-bot-access__url ltr" href="${escapeHtml(panelUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(panelAddress || panelUrl)} ${icon('north_west')}</a>`
              : `<code class="ltr">${escapeHtml(panelAddress || 'آدرس پنل دریافت نشد')}</code>`}
            <button type="button" class="icon-button" data-copy-audio-bot-url aria-label="کپی آدرس پنل" ${panelAddress ? '' : 'disabled'}>${icon('content_copy')}</button>
          </div>
        </div>
        <div class="audio-bot-access__item audio-bot-access__item--credentials">
          <span>${icon('key')}<small>Credentials</small></span>
          <div class="audio-bot-access__credential-row">
            <code class="ltr" data-audio-bot-credentials>${escapeHtml(credentials || 'Credentials دریافت نشد')}</code>
            <button type="button" class="icon-button" data-copy-audio-bot-credentials aria-label="کپی Credentials" ${credentials ? '' : 'disabled'}>${icon('content_copy')}</button>
          </div>
        </div>
        <div class="audio-bot-access__meta">
          ${icon('schedule')}
          <span>اعتبار دسترسی</span>
          <b>${access?.token?.validUntil ? faDate(access.token.validUntil) : '—'}</b>
        </div>
        <p class="audio-bot-access__hint">این اطلاعات دسترسی را فقط در اختیار مالک سرویس قرار دهید. آدرس پنل در تب جدید باز می‌شود.</p>
      </div>`;

      content.querySelector<HTMLButtonElement>('[data-copy-audio-bot-url]')?.addEventListener('click', () => {
        void copyPanelValue(panelAddress, 'آدرس پنل');
      });
      content.querySelector<HTMLButtonElement>('[data-copy-audio-bot-credentials]')?.addEventListener('click', () => {
        void copyPanelValue(credentials, 'Credentials پنل');
      });
    } catch (error) {
      if (!dialog.open) return;
      qs<HTMLElement>('.dialog__content', dialog).innerHTML = accessError(error);
    }
  })();
}
