declare const window: any;

export const environment = {
  production: true,
  apiUrl: 'https://api.interhub.vn',
  storageFileBaseUrl: 'https://s3.vn-hcm-1.vietnix.cloud/bravos/',
  get googleMapsApiKey(): string {
    return (window.__env && window.__env.GOOGLE_MAPS_API_KEY) || '';
  }
};

