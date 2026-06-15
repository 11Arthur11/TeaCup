import type { Money } from '../api/generated-models.js';
import { calculateInvoicePricing } from '../core/invoice-pricing.js';
import { faNumber, money } from '../core/format.js';

export function invoiceAmountCell(value?: Money | null, taxPercentage?: number | null): string {
  const pricing = calculateInvoicePricing(value, taxPercentage);
  return `<div class="invoice-amount-cell"><b>${money(pricing.total)}</b><small>مالیات ${faNumber(pricing.taxPercentage)}٪: ${money(pricing.tax)}</small></div>`;
}

export function invoiceTaxBreakdown(value?: Money | null, taxPercentage?: number | null): string {
  const pricing = calculateInvoicePricing(value, taxPercentage);
  return `<dl class="invoice-tax-breakdown">
    <div><dt>مبلغ پایه</dt><dd>${money(pricing.base)}</dd></div>
    <div><dt>مالیات (${faNumber(pricing.taxPercentage)}٪)</dt><dd>${money(pricing.tax)}</dd></div>
  </dl>`;
}
