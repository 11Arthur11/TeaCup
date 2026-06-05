import { api, ApiError } from './client.js';

/**
 * The backend session cookie is the only source of truth for authentication.
 * A 204 response means the session is active; 401 means the visitor is a guest.
 */
export async function hasActiveAuthSession(): Promise<boolean> {
  try {
    await api.call('checkSession', {});
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return false;
    throw error;
  }
}
