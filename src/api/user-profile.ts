import { api } from './client.js';
import { dataOf } from './data.js';
import type { UserDetailResponse } from './generated-models.js';

const PROFILE_CACHE_TTL_MS = 10 * 60 * 1_000;

let snapshot: UserDetailResponse | undefined;
let loadedAt = 0;
let inFlight: Promise<UserDetailResponse> | undefined;

export function cacheUserProfile(profile: UserDetailResponse): UserDetailResponse {
  snapshot = profile;
  loadedAt = Date.now();
  return profile;
}

export function getUserProfileSnapshot(): UserDetailResponse | undefined {
  return snapshot;
}

export function invalidateUserProfile(): void {
  snapshot = undefined;
  loadedAt = 0;
  inFlight = undefined;
}

export async function getUserProfile(options: { force?: boolean } = {}): Promise<UserDetailResponse> {
  if (!options.force && snapshot && Date.now() - loadedAt < PROFILE_CACHE_TTL_MS) return snapshot;
  if (!options.force && inFlight) return inFlight;

  const request = api.call('getProfile', {}).then((response) => {
    const profile = dataOf(response);
    if (!profile) throw new Error('پروفایل دریافت نشد.');
    return cacheUserProfile(profile);
  });

  if (!options.force) inFlight = request;
  try {
    return await request;
  } finally {
    if (inFlight === request) inFlight = undefined;
  }
}
