/**
 * Page-lifetime HTTP request guard.
 *
 * A 429 response activates a sticky client-side rate-limit latch. The latch is
 * intentionally reset only by a full browser reload, matching the backend's
 * expectation that automatic retries stop after a rate-limit response.
 */
let rateLimitActive = false;
let rateLimitRetryAfter: string | undefined;

export const RATE_LIMIT_EVENT = 'teacloud:rate-limit';

export function activateRateLimit(retryAfter?: string | null): boolean {
  const firstActivation = !rateLimitActive;
  rateLimitActive = true;
  rateLimitRetryAfter = retryAfter?.trim() || undefined;

  if (firstActivation) {
    window.dispatchEvent(new CustomEvent(RATE_LIMIT_EVENT, {
      detail: { retryAfter: rateLimitRetryAfter },
    }));
  }

  return firstActivation;
}

export function isRateLimitActive(): boolean {
  return rateLimitActive;
}

export function getRateLimitRetryAfter(): string | undefined {
  return rateLimitRetryAfter;
}
