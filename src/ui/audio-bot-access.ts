import { api, ApiError } from '../api/client.js';
import { dataOf } from '../api/data.js';
import { openDialog } from '../core/dialog.js';
import { escapeHtml, icon, qs, qsa } from '../core/dom.js';
import { faDate } from '../core/format.js';
import { notify } from '../core/toast.js';

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

async function copyCredentials(credentials: string): Promise<void> {
  if (!credentials) return;
  try {
    await navigator.clipboard.writeText(credentials);
    notify('Credentials پنل کپی شد.', 'success');
  } catch {
    notify('کپی خودکار انجام نشد؛ Credentials را به‌صورت دستی انتخاب کنید.', 'warning');
  }
}

export function audioBotPanelAccessCard(resourceId: number, resourceLabel = 'AudioBot'): string {
  return `<section class="card audio-bot-panel-card" data-audio-bot-panel-card data-resource-id="${resourceId}" data-resource-label="${escapeHtml(resourceLabel)}">
    <header class="card__header audio-bot-panel-card__header">
      <div>${icon('dashboard')}<h2>پنل اختصاصی AudioBot</h2></div>
      <button type="button" class="button button--secondary button--small" data-audio-bot-panel-load>${icon('visibility')} نمایش دسترسی</button>
    </header>
    <div class="card__body audio-bot-panel-card__body">
      <div class="audio-bot-panel-card__intro">
        <span class="audio-bot-panel-card__icon">${icon('shield_lock')}</span>
        <div><b>دسترسی موقت پنل مدیریت ربات</b><p>آدرس پنل و Credentials فقط هنگام درخواست نمایش داده می‌شوند و می‌توانید آن‌ها را مستقیماً کپی یا باز کنید.</p></div>
      </div>
      <div class="audio-bot-panel-card__access is-locked" data-audio-bot-panel-access>
        <div class="audio-bot-panel-card__field">
          <span>${icon('language')}<small>آدرس پنل</small></span>
          <div class="audio-bot-panel-card__masked ltr" data-audio-bot-panel-url>https://panel.teacloud.example/access</div>
        </div>
        <div class="audio-bot-panel-card__field">
          <span>${icon('key')}<small>Credentials</small></span>
          <div class="audio-bot-panel-card__credential-row">
            <code class="audio-bot-panel-card__masked ltr" data-audio-bot-panel-credentials>TC-••••••••-••••••••</code>
            <button type="button" class="icon-button" data-copy-audio-bot-panel-credentials aria-label="کپی Credentials" disabled>${icon('content_copy')}</button>
          </div>
        </div>
      </div>
      <div class="audio-bot-panel-card__meta" data-audio-bot-panel-meta hidden>${icon('schedule')}<span>اعتبار دسترسی</span><b data-audio-bot-panel-valid-until>—</b></div>
      <div class="audio-bot-panel-card__message" data-audio-bot-panel-message></div>
    </div>
  </section>`;
}

export function bindAudioBotPanelAccessCards(root: ParentNode = document): void {
  qsa<HTMLElement>('[data-audio-bot-panel-card]', root).forEach((card) => {
    const button = card.querySelector<HTMLButtonElement>('[data-audio-bot-panel-load]');
    if (!button || button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';

    button.addEventListener('click', async () => {
      const resourceId = Number(card.dataset.resourceId ?? 0);
      if (!Number.isInteger(resourceId) || resourceId <= 0) {
        notify('شناسه AudioBot معتبر نیست.', 'error');
        return;
      }

      const accessBox = card.querySelector<HTMLElement>('[data-audio-bot-panel-access]');
      const urlBox = card.querySelector<HTMLElement>('[data-audio-bot-panel-url]');
      const credentialsBox = card.querySelector<HTMLElement>('[data-audio-bot-panel-credentials]');
      const copyButton = card.querySelector<HTMLButtonElement>('[data-copy-audio-bot-panel-credentials]');
      const meta = card.querySelector<HTMLElement>('[data-audio-bot-panel-meta]');
      const validUntil = card.querySelector<HTMLElement>('[data-audio-bot-panel-valid-until]');
      const message = card.querySelector<HTMLElement>('[data-audio-bot-panel-message]');
      if (!accessBox || !urlBox || !credentialsBox || !copyButton || !meta || !validUntil || !message) return;

      button.disabled = true;
      button.innerHTML = `${icon('progress_activity')} در حال دریافت...`;
      message.innerHTML = '';

      try {
        const response = await api.call('getPanelAccess', { path: { resourceId } });
        const access = dataOf(response);
        const panelUrl = safePanelUrl(access?.panelAddress);
        const credentials = access?.token?.credentials?.trim() || '';

        accessBox.classList.remove('is-locked');
        accessBox.classList.add('is-revealed');

        if (panelUrl) {
          urlBox.innerHTML = `<a class="audio-bot-panel-card__url ltr" href="${escapeHtml(panelUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(access?.panelAddress || panelUrl)} ${icon('open_in_new')}</a>`;
        } else {
          urlBox.textContent = access?.panelAddress?.trim() || 'آدرس پنل دریافت نشد';
        }

        credentialsBox.textContent = credentials || 'Credentials دریافت نشد';
        copyButton.disabled = !credentials;
        copyButton.onclick = credentials ? () => { void copyCredentials(credentials); } : null;

        validUntil.textContent = access?.token?.validUntil ? faDate(access.token.validUntil) : '—';
        meta.hidden = false;
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
      const credentials = access?.token?.credentials?.trim() || '';
      const content = qs<HTMLElement>('.dialog__content', dialog);
      if (!dialog.open) return;

      content.innerHTML = `<div class="audio-bot-access">
        <div class="audio-bot-access__item">
          <span>${icon('open_in_new')}<small>آدرس پنل</small></span>
          ${panelUrl
            ? `<a class="audio-bot-access__url ltr" href="${escapeHtml(panelUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(access?.panelAddress || panelUrl)} ${icon('north_west')}</a>`
            : `<code class="ltr">${escapeHtml(access?.panelAddress || 'آدرس پنل دریافت نشد')}</code>`}
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

      content.querySelector<HTMLButtonElement>('[data-copy-audio-bot-credentials]')?.addEventListener('click', () => {
        void copyCredentials(credentials);
      });
    } catch (error) {
      if (!dialog.open) return;
      qs<HTMLElement>('.dialog__content', dialog).innerHTML = accessError(error);
    }
  })();
}
