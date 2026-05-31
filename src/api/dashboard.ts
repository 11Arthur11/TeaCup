import type { Money } from './generated-models.js';

/**
 * قرارداد پیشنهادی برای endpoint آینده داشبورد کاربر.
 * در حال حاضر عمداً به backend درخواست نمی‌زند تا زمانی که endpoint اضافه شود.
 */
export const USER_DASHBOARD_ENDPOINT = '/v1/dashboard/overview';

export interface UserDashboardOverview {
  walletBalance: Money;
  activeServices: number;
  totalServices: number;
  pendingInvoices: number;
  openTickets: number;
  generatedAt: string;
  source: 'mock' | 'backend';
}

const mockOverview: UserDashboardOverview = {
  walletBalance: { amount: 0, currency: 'IRT' },
  activeServices: 0,
  totalServices: 0,
  pendingInvoices: 0,
  openTickets: 0,
  generatedAt: new Date(0).toISOString(),
  source: 'mock',
};

export async function getUserDashboardOverview(): Promise<UserDashboardOverview> {
  return { ...mockOverview, walletBalance: { ...mockOverview.walletBalance } };
}
