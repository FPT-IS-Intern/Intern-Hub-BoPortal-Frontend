import { environment } from '@env/environment';

declare const window: any;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getBaseUrl(): string {
  const runtimeApiUrl = window.__env?.apiUrl;

  if (runtimeApiUrl) {
    return normalizeBaseUrl(runtimeApiUrl);
  }

  if (environment.apiUrl) {
    return normalizeBaseUrl(environment.apiUrl);
  }

  return '';
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
}
