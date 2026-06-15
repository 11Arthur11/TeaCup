import type { Money } from '../api/generated-models.js';

export interface InvoicePricing {
  base: Money;
  tax: Money;
  total: Money;
  taxPercentage: number;
}

function safeAmount(value?: Money | null): number {
  const amount = Number(value?.amount ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function safeTaxPercentage(value?: number | null): number {
  const percentage = Number(value ?? 0);
  return Number.isFinite(percentage) ? Math.max(0, Math.trunc(percentage)) : 0;
}

export function calculateInvoicePricing(value?: Money | null, taxPercentage?: number | null): InvoicePricing {
  const amount = safeAmount(value);
  const percentage = safeTaxPercentage(taxPercentage);
  const currency = value?.currency ?? 'IRT';
  const taxAmount = Math.round((amount * percentage) / 100);
  return {
    base: { amount, currency },
    tax: { amount: taxAmount, currency },
    total: { amount: amount + taxAmount, currency },
    taxPercentage: percentage,
  };
}
