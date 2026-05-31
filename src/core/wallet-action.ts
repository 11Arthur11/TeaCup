import { api, backendMessage } from '../api/client.js';
import { runAction } from './action.js';
import { openDialog } from './dialog.js';
import { requiredNumber } from './dom.js';
import { router } from './router.js';
import { notify } from './toast.js';
import { field } from '../ui/components.js';

export function openChargeWalletDialog(): void {
  const form = document.createElement('form');
  form.innerHTML = field('amount', 'مبلغ شارژ (تومان)', {
    type: 'number',
    required: true,
    min: 1000,
    step: '1000',
    placeholder: '100000',
  });

  openDialog({
    title: 'شارژ کیف پول',
    description: 'پس از ایجاد فاکتور به صفحه پرداخت هدایت می‌شوید.',
    content: form,
    confirmLabel: 'ساخت فاکتور',
    onConfirm: async () => {
      if (!form.reportValidity()) return false;
      const data = new FormData(form);
      const response = await runAction(
        () => api.call('chargeWallet', { body: { amount: requiredNumber(data.get('amount')) } }),
        { silentSuccess: true },
      );
      if (!response) return false;

      const values = response.data ? Object.values(response.data) : [];
      const token = response.data?.invoiceToken ?? response.data?.token ?? values[0];
      if (!token) {
        notify(backendMessage(response) ?? 'فاکتور ساخته شد اما شناسه آن در پاسخ وجود نداشت.', 'warning');
        return false;
      }
      if (backendMessage(response)) notify(backendMessage(response)!, 'success');
      router.navigate(`/panel/invoices/${encodeURIComponent(token)}`);
      return true;
    },
  });
}
