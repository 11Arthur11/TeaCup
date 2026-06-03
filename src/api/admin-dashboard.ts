import { api } from './client.js';
import { dataOf } from './data.js';
import type { AdminMetric, Money } from './generated-models.js';

const CACHE_TTL_MS = 5_000;

export type ProvisionStrategy = 'BALANCED' | 'BIN_PACKING' | 'RANDOMIZED' | 'ROUND_ROBIN';

export interface PeriodComparison {
  current: number;
  previous: number;
}

export interface WalletFlowComparisons {
  day: PeriodComparison;
  week: PeriodComparison;
  month: PeriodComparison;
}

export interface AdminDashboardOverview {
  wallet: {
    totalUserWalletBalance: number;
    totalBalance: Money;
    charges: WalletFlowComparisons;
    spending: WalletFlowComparisons;
  };
  users: {
    today: number;
    yesterday: number;
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
    currentOnline: number;
  };
  services: {
    total: number;
    running: number;
    suspended: number;
    pendingProvisioning: number;
  };
  tickets: {
    open: number;
    answered: number;
    waitingCustomer: number;
    closed: number;
  };
  nodes: {
    query: { active: number; total: number; strategy?: ProvisionStrategy };
    audioBot: { active: number; total: number; strategy?: ProvisionStrategy };
  };
}

const zeroMoney = (): Money => ({ amount: 0, currency: 'IRT' });
const comparison = (value?: { current?: number; previous?: number }): PeriodComparison => ({
  current: Number(value?.current ?? 0),
  previous: Number(value?.previous ?? 0),
});

function normalize(value?: AdminMetric): AdminDashboardOverview {
  const totalBalance = value?.financeMetric?.totalBalance ?? zeroMoney();
  const querySummary = value?.queryInstanceMetric?.nodeSummary;
  const audioSummary = value?.audioBotNodeMetric?.nodeSummary;
  return {
    wallet: {
      totalUserWalletBalance: Number(totalBalance.amount ?? 0),
      totalBalance,
      charges: {
        day: comparison(value?.financeMetric?.income?.daily),
        week: comparison(value?.financeMetric?.income?.weekly),
        month: comparison(value?.financeMetric?.income?.monthly),
      },
      spending: {
        day: comparison(value?.financeMetric?.spending?.daily),
        week: comparison(value?.financeMetric?.spending?.weekly),
        month: comparison(value?.financeMetric?.spending?.monthly),
      },
    },
    users: {
      today: Number(value?.userMetric?.dailyRegisters?.current ?? 0),
      yesterday: Number(value?.userMetric?.dailyRegisters?.previous ?? 0),
      thisWeek: Number(value?.userMetric?.weeklyRegisters?.current ?? 0),
      lastWeek: Number(value?.userMetric?.weeklyRegisters?.previous ?? 0),
      thisMonth: Number(value?.userMetric?.monthlyRegisters?.current ?? 0),
      lastMonth: Number(value?.userMetric?.monthlyRegisters?.previous ?? 0),
      currentOnline: Number(value?.userMetric?.currentOnline ?? 0),
    },
    services: {
      total: Number(value?.resourceMetric?.total ?? 0),
      running: Number(value?.resourceMetric?.active ?? 0),
      suspended: Number(value?.resourceMetric?.suspended ?? 0),
      pendingProvisioning: Number(value?.resourceMetric?.deploying ?? 0),
    },
    tickets: {
      open: Number(value?.ticketMetric?.pending ?? 0),
      answered: Number(value?.ticketMetric?.responded ?? 0),
      waitingCustomer: Number(value?.ticketMetric?.waiting ?? 0),
      closed: Number(value?.ticketMetric?.closed ?? 0),
    },
    nodes: {
      query: {
        active: Number(querySummary?.count ?? 0),
        total: Number(querySummary?.total ?? 0),
        strategy: value?.queryInstanceMetric?.nodeStrategy,
      },
      audioBot: {
        active: Number(audioSummary?.count ?? 0),
        total: Number(audioSummary?.total ?? 0),
        strategy: value?.audioBotNodeMetric?.nodeStrategy,
      },
    },
  };
}

let snapshot: AdminDashboardOverview | undefined;
let fetchedAt = 0;
let inFlight: Promise<AdminDashboardOverview> | undefined;

/** Shared five-second admin overview cache used by dashboard and specialist pages. */
export async function getAdminDashboardOverview(options: { force?: boolean } = {}): Promise<AdminDashboardOverview> {
  const fresh = snapshot && fetchedAt > 0 && Date.now() - fetchedAt < CACHE_TTL_MS;
  if (!options.force && fresh && snapshot) return snapshot;
  if (inFlight) return inFlight;

  const request = api.call('overview', {})
    .then((response) => {
      const normalized = normalize(dataOf(response));
      snapshot = normalized;
      fetchedAt = Date.now();
      return normalized;
    })
    .finally(() => {
      if (inFlight === request) inFlight = undefined;
    });

  inFlight = request;
  return request;
}

export function invalidateAdminDashboardOverview(): void {
  fetchedAt = 0;
}
