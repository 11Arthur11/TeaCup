export interface MockPeriodComparison {
  current: number;
  previous: number;
}

export interface MockWalletFlowComparisons {
  day: MockPeriodComparison;
  week: MockPeriodComparison;
  month: MockPeriodComparison;
}

export interface MockAdminDashboardOverview {
  wallet: {
    totalUserWalletBalance: number;
    charges: MockWalletFlowComparisons;
    spending: MockWalletFlowComparisons;
  };
  users: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    currentOnline: number;
  };
  services: {
    total: number;
    running: number;
    suspended: number;
    expired: number;
    pendingProvisioning: number;
  };
  tickets: {
    open: number;
    answered: number;
    waitingCustomer: number;
    closed: number;
  };
  nodes: {
    query: { active: number; total: number };
    audioBot: { active: number; total: number };
  };
}

/**
 * Mock-only aggregate for the admin dashboard.
 * Replace the function body with the future backend overview endpoint.
 */
export function getMockAdminDashboardOverview(): MockAdminDashboardOverview {
  return {
    wallet: {
      totalUserWalletBalance: 1_864_250_000,
      charges: {
        day: { current: 18_500_000, previous: 14_200_000 },
        week: { current: 96_400_000, previous: 88_100_000 },
        month: { current: 412_800_000, previous: 386_500_000 },
      },
      spending: {
        day: { current: 12_100_000, previous: 13_750_000 },
        week: { current: 71_600_000, previous: 66_200_000 },
        month: { current: 298_900_000, previous: 321_400_000 },
      },
    },
    users: {
      today: 9,
      thisWeek: 47,
      thisMonth: 186,
      currentOnline: 32,
    },
    services: {
      total: 284,
      running: 237,
      suspended: 14,
      expired: 21,
      pendingProvisioning: 12,
    },
    tickets: {
      open: 18,
      answered: 42,
      waitingCustomer: 11,
      closed: 391,
    },
    nodes: {
      query: { active: 5, total: 6 },
      audioBot: { active: 4, total: 5 },
    },
  };
}
