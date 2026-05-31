import { api } from './client.js';
import { dataOf } from './data.js';
import type { Money } from './generated-models.js';

/**
 * Wallet balance is returned by the backend as a numeric IRT amount.
 * This adapter exposes the same Money shape used by the rest of the UI.
 */
export async function getWalletBalanceMoney(): Promise<Money> {
  const response = await api.call('getBalance', {});
  return { amount: Number(dataOf(response) ?? 0), currency: 'IRT' };
}
