import { api } from './client.js';
import { dataOf } from './data.js';
import type { Money, WalletOverviewResponse } from './generated-models.js';

const CACHE_TTL_MS = 5_000;
const zeroMoney = (): Money => ({ amount: 0, currency: 'IRT' });

const emptyOverview = (): WalletOverviewResponse => ({
  balance: zeroMoney(),
  spentLast30days: zeroMoney(),
  spentLast7days: zeroMoney(),
  spentLastDay: zeroMoney(),
});

let snapshot: WalletOverviewResponse = emptyOverview();
let fetchedAt = 0;
let inFlight: Promise<WalletOverviewResponse> | undefined;

function normalizeOverview(value?: WalletOverviewResponse): WalletOverviewResponse {
  return {
    balance: value?.balance ?? zeroMoney(),
    spentLast30days: value?.spentLast30days ?? zeroMoney(),
    spentLast7days: value?.spentLast7days ?? zeroMoney(),
    spentLastDay: value?.spentLastDay ?? zeroMoney(),
    autoRenewalCoverageUntil: value?.autoRenewalCoverageUntil,
  };
}

/**
 * Shared wallet overview request. Header, dashboard and finance use this same
 * cache/in-flight promise so one five-second cycle never fans out into
 * duplicate overview calls.
 */
export async function getWalletOverview(options: { force?: boolean } = {}): Promise<WalletOverviewResponse> {
  const fresh = fetchedAt > 0 && Date.now() - fetchedAt < CACHE_TTL_MS;
  if (!options.force && fresh) return snapshot;
  if (inFlight) return inFlight;

  const request = api.call('getBalance', {})
    .then((response) => {
      snapshot = normalizeOverview(dataOf(response));
      fetchedAt = Date.now();
      window.dispatchEvent(new CustomEvent('teacloud:wallet-overview', { detail: snapshot }));
      return snapshot;
    })
    .finally(() => {
      if (inFlight === request) inFlight = undefined;
    });

  inFlight = request;
  return request;
}

export function getWalletOverviewSnapshot(): WalletOverviewResponse {
  return snapshot;
}

export function invalidateWalletOverview(): void {
  fetchedAt = 0;
}
