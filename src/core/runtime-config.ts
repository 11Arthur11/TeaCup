export type PublicFileKey = 'dashboardTour' | 'rules';

interface TeaCloudRuntimeConfig {
  apiBaseUrl?: string;
  publicFilesBaseUrl?: string;
  publicFiles?: Partial<Record<PublicFileKey, string>>;
}

type RuntimeGlobals = typeof globalThis & {
  TEACLOUD_CONFIG?: TeaCloudRuntimeConfig;
  TEACLOUD_API_BASE_URL?: string;
  TEACLOUD_PUBLIC_FILES_BASE_URL?: string;
  TEACLOUD_PUBLIC_BASE_URL?: string;
};

const globals = globalThis as RuntimeGlobals;

function nonEmpty(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function absoluteUrl(value: string, base: string): string {
  return new URL(value, base).href;
}

function directoryUrl(value: string): string {
  const normalized = value.endsWith('/') ? value : `${value}/`;
  return absoluteUrl(normalized, location.origin);
}

export function runtimeApiBaseUrl(): string {
  return nonEmpty(globals.TEACLOUD_CONFIG?.apiBaseUrl)
    ?? nonEmpty(globals.TEACLOUD_API_BASE_URL)
    ?? document.querySelector<HTMLMetaElement>('meta[name="api-base-url"]')?.content
    ?? 'http://localhost:8080';
}

export function publicFilesBaseUrl(): string {
  return directoryUrl(
    nonEmpty(globals.TEACLOUD_CONFIG?.publicFilesBaseUrl)
      ?? nonEmpty(globals.TEACLOUD_PUBLIC_FILES_BASE_URL)
      ?? nonEmpty(globals.TEACLOUD_PUBLIC_BASE_URL)
      ?? '/content/',
  );
}

export function publicFileUrl(key: PublicFileKey, defaultFilename: string): string {
  const configured = nonEmpty(globals.TEACLOUD_CONFIG?.publicFiles?.[key]) ?? defaultFilename;
  return absoluteUrl(configured, publicFilesBaseUrl());
}

export function publicFileCandidates(key: PublicFileKey, defaultFilename: string): string[] {
  const candidates = [
    publicFileUrl(key, defaultFilename),
    absoluteUrl(`/content/${defaultFilename}`, location.origin),
  ];
  return [...new Set(candidates)];
}
