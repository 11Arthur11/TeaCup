import { api, ApiError } from './client.js';
import { parseUserRole } from '../core/authorization.js';
import type { IdentityState } from '../core/store.js';
import { cacheUserProfile } from './user-profile.js';

/**
 * The authenticated profile is the single source of truth for frontend authorization.
 * Backend session validity remains cookie-based and every 403 is handled globally.
 */
export async function fetchSessionProfile(): Promise<IdentityState> {
  const response = await api.call('getProfile', {});
  const profile = response.data;
  const role = parseUserRole(profile?.role);

  if (!role) {
    throw new ApiError('نقش حساب کاربری در پاسخ پروفایل معتبر نیست.', 500, response);
  }

  if (profile) cacheUserProfile(profile);

  return {
    status: 'authenticated',
    userId: null,
    role,
    raw: response,
  };
}
