import { api } from './client.js';
import { dataOf } from './data.js';
import type { DashboardOverviewResponse, ResourceOverviewResponse } from './generated-models.js';

export const USER_DASHBOARD_ENDPOINT = '/v1/dashboard/overview';

const emptyResourceMetric = (): ResourceOverviewResponse => ({
  total: 0,
  active: 0,
  suspended: 0,
});

function normalizeOverview(value?: DashboardOverviewResponse): DashboardOverviewResponse {
  return {
    resourceMetric: {
      ...emptyResourceMetric(),
      ...(value?.resourceMetric ?? {}),
    },
    openTickets: Number(value?.openTickets ?? 0),
  };
}

export async function getUserDashboardOverview(): Promise<DashboardOverviewResponse> {
  const response = await api.call('getDashboardOverviewResponse', {});
  return normalizeOverview(dataOf(response));
}
