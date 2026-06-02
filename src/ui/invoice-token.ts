import { escapeHtml, icon, qsa } from '../core/dom.js';
import { notify } from '../core/toast.js';

function compactToken(value: string): string {
  if (value.length <= 20) return value;
  return `${value.slice(0, 13)}…${value.slice(-5)}`;
}

export function invoiceTokenView(value: string | undefined, href?: string): string {
  const token = value?.trim() ?? '';
  if (!token) return '<span>—</span>';
  const safeToken = escapeHtml(token);
  const compact = escapeHtml(compactToken(token));
  const primary = href
    ? `<a data-link class="invoice-token__compact text-link strong ltr" href="${escapeHtml(href)}" title="${safeToken}">${compact}</a>`
    : `<code class="invoice-token__compact ltr" title="${safeToken}">${compact}</code>`;
  return `<span class="invoice-token" dir="ltr">
    ${primary}
    <button type="button" class="invoice-token__copy" data-copy-invoice-token="${safeToken}" aria-label="کپی شناسه فاکتور" title="کپی شناسه کامل">${icon('content_copy')}</button>
  </span>`;
}

export function bindInvoiceTokenCopies(root: ParentNode = document): void {
  qsa<HTMLButtonElement>('[data-copy-invoice-token]', root).forEach((button) => button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const token = button.dataset.copyInvoiceToken?.trim();
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      notify('شناسه فاکتور کپی شد.', 'success');
    } catch {
      notify('کپی خودکار انجام نشد؛ شناسه را به‌صورت دستی انتخاب کنید.', 'warning');
    }
  }));
}
