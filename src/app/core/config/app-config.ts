export function getBaseUrl(): string {
  const appEnv = (window as any).__env;

  if (appEnv && appEnv.apiUrl) {
    return appEnv.apiUrl;
  }

  return '';
}
