import { api, ApiError } from './client.js';
import { dataOf } from './data.js';
import type * as Models from './generated-models.js';

export type DnsAvailabilityState = 'available' | 'taken' | 'error';

export interface AdminDnsRecord {
  id?: number;
  name?: string;
  type?: string;
  value?: string;
  ttl?: number;
  assigned?: boolean;
  ownerId?: number;
  targetResourceId?: number;
  zoneName?: string;
  status?: string;
}

function objectOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function arrayFromUnknown<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  const object = objectOf(value);
  for (const key of ['content', 'records', 'items', 'data']) {
    if (Array.isArray(object[key])) return object[key] as T[];
  }
  return [];
}

export async function getUserDnsRecords(): Promise<Models.DnsRecordUserResponse[]> {
  return dataOf(await api.call('getAssignedRecords', {})) ?? [];
}

export async function getUserDnsRecordForResource(resourceId: number): Promise<Models.DnsRecordUserResponse | undefined> {
  try {
    return dataOf(await api.call('getAssignedRecord', { path: { resourceId } }));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 204)) return undefined;
    throw error;
  }
}

export async function getAvailableDnsZones(): Promise<Models.ZoneUserResponse[]> {
  return dataOf(await api.call('getAvailableZones', {})) ?? [];
}

export async function checkSubdomainAvailability(zoneId: number, subdomain: string): Promise<DnsAvailabilityState> {
  try {
    await api.call('isAvailable', { path: { zoneId, subdomain } });
    return 'available';
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return 'taken';
    return 'error';
  }
}

export function assignSubdomain(body: Models.AssignSubdomainRequest): Promise<Models.SimpleResponse> {
  return api.call('assignSubdomain', { body });
}

export function unassignUserDnsRecord(recordId: number): Promise<Models.SimpleResponse> {
  return api.call('unassignRecord', { path: { recordId } });
}

export async function getAdminZoneRecords(zoneName: string): Promise<AdminDnsRecord[]> {
  const response = await api.call('zoneRecords', { path: { zoneName } });
  return arrayFromUnknown<AdminDnsRecord>(dataOf(response) ?? response);
}

export async function getAdminResourceDnsRecords(resourceId: number): Promise<AdminDnsRecord[]> {
  const response = await api.call('liaraZoneRecords', { path: { resourceId } });
  return arrayFromUnknown<AdminDnsRecord>(dataOf(response) ?? response);
}

export function toggleAdminDnsZone(zoneId: number): Promise<Models.SimpleResponse> {
  return api.call('toggleZoneActive', { path: { zoneId } });
}

export function reassignAdminDnsRecord(recordId: number): Promise<Models.SimpleResponse> {
  return api.call('reassignRecord', { path: { recordId } });
}

export function unassignAdminDnsRecord(recordId: number): Promise<Models.SimpleResponse> {
  return api.call('unassignRecord_1', { path: { recordId } });
}
