import { api, ApiError } from './client.js';
import { parseUserRole } from '../core/authorization.js';
import type { IdentityState } from '../core/store.js';

/**
 * The authenticated profile is the single source of truth for frontend authorization.
 * Backend session validity remains cookie-based and every 403 is handled globally.
 */
export async function fetchSessionProfile(): Promise<IdentityState> {
  const response = await api.call('getProfile', {});
  const role = parseUserRole(response.data?.role);

  if (!role) {
    throw new ApiError('نقش حساب کاربری در پاسخ پروفایل معتبر نیست.', 500, response);
  }

  return {
    status: 'authenticated',
    userId: null,
    role,
    raw: response,
  };
}
