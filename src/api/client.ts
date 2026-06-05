import { operations, type OperationId, type OperationInputMap, type OperationOutputMap } from './generated-operations.js';
import { markBackendAvailable, markBackendUnavailable } from '../core/backend-availability.js';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly payload?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiEnvelope { success?: boolean; type?: string; message?: string; data?: unknown; }

type ForbiddenHandler = (context: { operationId?: OperationId; path: string }) => void;
type NetworkFailureHandler = (context: { operationId?: OperationId; path: string; error: unknown }) => void;
let forbiddenHandler: ForbiddenHandler | undefined;
let networkFailureHandler: NetworkFailureHandler | undefined;

export function setForbiddenHandler(handler: ForbiddenHandler): void {
  forbiddenHandler = handler;
}

export function setNetworkFailureHandler(handler: NetworkFailureHandler): void {
  networkFailureHandler = handler;
}

function reportForbidden(path: string, operationId?: OperationId): void {
  if (operationId === 'logout' || path === '/v1/auth/logout') return;
  forbiddenHandler?.({ operationId, path });
}

const API_BASE_URL = (globalThis as typeof globalThis & { TEACLOUD_API_BASE_URL?: string }).TEACLOUD_API_BASE_URL
  ?? document.querySelector<HTMLMetaElement>('meta[name="api-base-url"]')?.content
  ?? 'http://localhost:8080';

const MAX_CONCURRENT_REQUESTS = 6;
const READ_ONLY_POST_OPERATIONS = new Set<OperationId>(['getAllResources', 'getAudioBotPlaylistDetail']);

function fillPath(pathTemplate: string, values?: Record<string, unknown>): string {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_match, key: string) => encodeURIComponent(String(values?.[key] ?? '')));
}

function appendQuery(search: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null || value === '') return;
  if (Array.isArray(value)) { value.forEach((entry) => appendQuery(search, key, entry)); return; }
  if (value instanceof Date) { search.append(key, value.toISOString()); return; }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([nestedKey, nestedValue]) => appendQuery(search, nestedKey, nestedValue));
    return;
  }
  search.append(key, String(value));
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (value instanceof FormData) return '[form-data]';
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`);
  return `{${entries.join(',')}}`;
}

async function parseResponse(response: Response, responseKind: 'json' | 'blob' | 'void'): Promise<unknown> {
  if (responseKind === 'blob') return response.blob();
  if (responseKind === 'void' || response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try { return JSON.parse(text) as unknown; } catch { return text; }
}

function isNoData(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  return String((payload as ApiEnvelope).type ?? '').trim().toUpperCase() === 'NO_DATA';
}

function messageFrom(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const message = (payload as ApiEnvelope).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (typeof payload === 'string' && payload.trim()) return payload;
  return fallback;
}

class RequestPool {
  private active = 0;
  private waiting: Array<() => void> = [];

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= MAX_CONCURRENT_REQUESTS) {
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
    this.active += 1;
    try {
      return await task();
    } finally {
      this.active -= 1;
      this.waiting.shift()?.();
    }
  }
}

export class ApiClient {
  private readonly pool = new RequestPool();
  private readonly inFlightReads = new Map<string, Promise<unknown>>();

  async call<K extends OperationId>(operationId: K, input: OperationInputMap[K]): Promise<OperationOutputMap[K]> {
    const operation = operations[operationId];
    const isReadOnly = operation.method === 'GET' || operation.method === 'HEAD' || READ_ONLY_POST_OPERATIONS.has(operationId);
    const requestKey = isReadOnly ? `${operationId}:${stableSerialize(input)}` : undefined;
    const existing = requestKey ? this.inFlightReads.get(requestKey) : undefined;
    if (existing) return existing as Promise<OperationOutputMap[K]>;

    const request = this.executeCall(operationId, input);
    if (requestKey) this.inFlightReads.set(requestKey, request);
    try {
      return await request;
    } finally {
      if (requestKey && this.inFlightReads.get(requestKey) === request) this.inFlightReads.delete(requestKey);
    }
  }

  private async executeCall<K extends OperationId>(operationId: K, input: OperationInputMap[K]): Promise<OperationOutputMap[K]> {
    const operation = operations[operationId];
    const payload = input as { path?: Record<string, unknown>; query?: Record<string, unknown>; body?: unknown };
    const url = new URL(fillPath(operation.path, payload.path), API_BASE_URL);
    Object.entries(payload.query ?? {}).forEach(([key, value]) => appendQuery(url.searchParams, key, value));

    const headers = new Headers({ Accept: 'application/json' });
    let body: BodyInit | undefined;
    if (operation.bodyKind === 'json' && payload.body !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(payload.body);
    } else if (operation.bodyKind === 'multipart') {
      body = payload.body as FormData;
    } else if (operation.bodyKind === 'form') {
      headers.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
      body = payload.body as URLSearchParams;
    }

    return this.pool.run(async () => {
      let response: Response;
      try {
        response = await fetch(url, { method: operation.method, credentials: 'include', headers, body });
      } catch (error) {
        markBackendUnavailable();
        networkFailureHandler?.({ operationId, path: url.pathname, error });
        throw new ApiError('ارتباط با سرور برقرار نشد. سامانه احتمالاً در حال نگهداری است.', 0, error);
      }
      markBackendAvailable();
      const parsed = await parseResponse(response, operation.responseKind);
      if (response.status === 403) reportForbidden(url.pathname, operationId);
      if (isNoData(parsed) && response.status !== 403) return parsed as OperationOutputMap[K];
      if (!response.ok) throw new ApiError(messageFrom(parsed, `خطای ارتباط با سرور (${response.status})`), response.status, parsed);
      if (parsed && typeof parsed === 'object' && 'success' in parsed && (parsed as ApiEnvelope).success === false) {
        throw new ApiError(messageFrom(parsed, 'عملیات انجام نشد.'), response.status, parsed);
      }
      return parsed as OperationOutputMap[K];
    });
  }

  async raw<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const url = new URL(path, API_BASE_URL);
    return this.pool.run(async () => {
      let response: Response;
      try {
        response = await fetch(url, { ...init, credentials: 'include', headers: { Accept: 'application/json', ...(init.headers ?? {}) } });
      } catch (error) {
        markBackendUnavailable();
        networkFailureHandler?.({ path: url.pathname, error });
        throw new ApiError('ارتباط با سرور برقرار نشد. سامانه احتمالاً در حال نگهداری است.', 0, error);
      }
      markBackendAvailable();
      const kind = response.headers.get('content-type')?.includes('application/json') ? 'json' : 'void';
      const parsed = await parseResponse(response, kind);
      if (response.status === 403) reportForbidden(url.pathname);
      if (isNoData(parsed) && response.status !== 403) return parsed as T;
      if (!response.ok) throw new ApiError(messageFrom(parsed, `خطای ارتباط با سرور (${response.status})`), response.status, parsed);
      return parsed as T;
    });
  }
}

export const api = new ApiClient();
export const backendMessage = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const message = (value as ApiEnvelope).message;
  return typeof message === 'string' && message.trim() ? message : undefined;
};
export const apiBaseUrl = API_BASE_URL;
