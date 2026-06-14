/**
 * TeaCloud runtime configuration.
 * This file is copied to dist/config.js and can be edited in production without rebuilding.
 *
 * To host public JSON files elsewhere, set publicFilesBaseUrl to a directory URL, for example:
 *   https://example.com/public/
 * The app will then request dashboard-tour.json and rules.json from that directory.
 */
const currentConfig = globalThis.TEACLOUD_CONFIG ?? {};

globalThis.TEACLOUD_CONFIG = {
  apiBaseUrl:
    currentConfig.apiBaseUrl
    ?? globalThis.TEACLOUD_API_BASE_URL
    ?? 'http://localhost:8080',

  publicFilesBaseUrl:
    currentConfig.publicFilesBaseUrl
    ?? globalThis.TEACLOUD_PUBLIC_FILES_BASE_URL
    ?? '/content/',

  publicFiles: {
    dashboardTour: 'dashboard-tour.json',
    rules: 'rules.json',
    ...(currentConfig.publicFiles ?? {}),
  },
};

// Backward-compatible aliases for older deployments.
globalThis.TEACLOUD_API_BASE_URL ??= globalThis.TEACLOUD_CONFIG.apiBaseUrl;
globalThis.TEACLOUD_PUBLIC_FILES_BASE_URL ??= globalThis.TEACLOUD_CONFIG.publicFilesBaseUrl;
