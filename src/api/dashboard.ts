import { api } from './client.js';
import { dataOf } from './data.js';
import type { ResourceMetricResponse, UserDashboardOverviewResponse } from './generated-models.js';

export const USER_DASHBOARD_ENDPOINT = '/v1/dashboard/overview';

const emptyResourceMetric = (): ResourceMetricResponse => ({
  total: 0,
  active: 0,
  suspended: 0,
});

function normalizeOverview(value?: UserDashboardOverviewResponse): UserDashboardOverviewResponse {
  return {
    resourceMetric: {
      ...emptyResourceMetric(),
      ...(value?.resourceMetric ?? {}),
    },
    openTickets: Number(value?.openTickets ?? 0),
  };
}

export async function getUserDashboardOverview(): Promise<UserDashboardOverviewResponse> {
  const response = await api.call('getDashboardOverview', {});
  return normalizeOverview(dataOf(response));
}
