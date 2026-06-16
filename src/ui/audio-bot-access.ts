import { api, ApiError } from '../api/client.js';
import { dataOf } from '../api/data.js';
import { openDialog } from '../core/dialog.js';
import { escapeHtml, icon, qs } from '../core/dom.js';
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

function accessError(error: unknown): string {
  const message = error instanceof ApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'دریافت دسترسی پنل AudioBot با خطا مواجه شد.';
  return `<div class="notice notice--warning">${icon('warning')}<span>${escapeHtml(message)}</span></div>`;
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

      content.querySelector<HTMLButtonElement>('[data-copy-audio-bot-credentials]')?.addEventListener('click', async () => {
        if (!credentials) return;
        try {
          await navigator.clipboard.writeText(credentials);
          notify('Credentials پنل کپی شد.', 'success');
        } catch {
          notify('کپی خودکار انجام نشد؛ Credentials را به‌صورت دستی انتخاب کنید.', 'warning');
        }
      });
    } catch (error) {
      if (!dialog.open) return;
      qs<HTMLElement>('.dialog__content', dialog).innerHTML = accessError(error);
    }
  })();
}
