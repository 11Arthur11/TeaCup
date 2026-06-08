import { escapeHtml, icon, qs } from './dom.js';

let submittingDialog: HTMLDialogElement | undefined;

export function closeSubmittingDialogOnError(): void {
  if (submittingDialog?.open) submittingDialog.close();
}

export interface DialogOptions {
  title: string;
  description?: string;
  content?: string | HTMLElement;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  wide?: boolean;
  compact?: boolean;
  hideFooter?: boolean;
  onConfirm?: (dialog: HTMLDialogElement) => Promise<boolean | void> | boolean | void;
}

export function openDialog(options: DialogOptions): HTMLDialogElement {
  const root = qs<HTMLElement>('#dialog-root');
  const dialog = document.createElement('dialog');
  dialog.className = `dialog ${options.wide ? 'dialog--wide' : ''} ${options.compact ? 'dialog--compact' : ''}`;
  dialog.innerHTML = `
    <div class="dialog__surface">
      <header class="dialog__header">
        <div><h2>${escapeHtml(options.title)}</h2>${options.description ? `<p>${escapeHtml(options.description)}</p>` : ''}</div>
        <button class="icon-button" data-close aria-label="بستن">${icon('close')}</button>
      </header>
      <section class="dialog__content"></section>
      ${options.hideFooter ? '' : `<footer class="dialog__actions">
        <button class="button button--ghost" data-close>${escapeHtml(options.cancelLabel ?? 'انصراف')}</button>
        ${options.onConfirm ? `<button class="button ${options.danger ? 'button--danger' : 'button--primary'}" data-confirm>${escapeHtml(options.confirmLabel ?? 'تأیید')}</button>` : ''}
      </footer>`}
    </div>`;
  const content = qs<HTMLElement>('.dialog__content', dialog);
  if (typeof options.content === 'string') content.innerHTML = options.content;
  else if (options.content) content.append(options.content);
  const close = (): void => dialog.close();
  dialog.querySelectorAll('[data-close]').forEach((node) => node.addEventListener('click', close));
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  const confirm = dialog.querySelector<HTMLButtonElement>('[data-confirm]');
  confirm?.addEventListener('click', async () => {
    confirm.disabled = true;
    confirm.dataset.loading = 'true';
    submittingDialog = dialog;
    try {
      const result = await options.onConfirm?.(dialog);
      if (result !== false && dialog.open) close();
    } finally {
      if (submittingDialog === dialog) submittingDialog = undefined;
      confirm.disabled = false;
      delete confirm.dataset.loading;
    }
  });
  root.append(dialog);
  dialog.showModal();
  return dialog;
}

export function confirmDialog(title: string, description: string, actionLabel: string, onConfirm: () => Promise<void>, danger = false): void {
  openDialog({ title, description, confirmLabel: actionLabel, danger, onConfirm: async () => { await onConfirm(); } });
}
