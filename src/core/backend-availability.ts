import { isRateLimitActive } from './request-guard.js';
export type BackendAvailability = 'unknown' | 'available' | 'unavailable';

type Listener = (status: BackendAvailability) => void;

const STORAGE_KEY = 'teacloud-backend-unavailable';
let status: BackendAvailability = sessionStorage.getItem(STORAGE_KEY) === '1' ? 'unavailable' : 'unknown';
const listeners = new Set<Listener>();
let probePromise: Promise<BackendAvailability> | undefined;

function publish(next: BackendAvailability): void {
  if (status === next) return;
  status = next;
  if (next === 'unavailable') sessionStorage.setItem(STORAGE_KEY, '1');
  else sessionStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener(status));
}

export function getBackendAvailability(): BackendAvailability {
  return status;
}

export function markBackendAvailable(): void {
  publish('available');
}

export function markBackendUnavailable(): void {
  publish('unavailable');
}

export function subscribeBackendAvailability(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Temporary liveness probe until the backend exposes a dedicated public health endpoint.
 * Any HTTP response proves that the backend is reachable; only a network-level fetch failure
 * is treated as maintenance/unavailability.
 */
export async function probeBackendAvailability(apiBaseUrl: string): Promise<BackendAvailability> {
  if (isRateLimitActive()) return status;
  if (probePromise) return probePromise;
  probePromise = (async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4_000);
    try {
      await fetch(new URL('/v1/categories', apiBaseUrl), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      markBackendAvailable();
    } catch {
      markBackendUnavailable();
    } finally {
      window.clearTimeout(timeout);
    }
    return status;
  })();
  try { return await probePromise; }
  finally { probePromise = undefined; }
}
