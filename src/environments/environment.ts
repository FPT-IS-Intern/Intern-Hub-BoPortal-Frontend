declare const window: any;

export const environment = {
  production: false,
  useMock: true,
  apiUrl: 'http://localhost:8080',
  storageFileBaseUrl: 'https://s3.vn-hcm-1.vietnix.cloud/bravos/',
  get googleMapsApiKey(): string {
    return (window.__env && window.__env.GOOGLE_MAPS_API_KEY) || '';
  }
};
