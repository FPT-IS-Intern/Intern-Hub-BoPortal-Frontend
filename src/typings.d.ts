declare module 'jsencrypt';

declare global {
  interface Window {
    __env?: {
      apiUrl?: string;
      GOOGLE_MAPS_API_KEY?: string;
    };
  }
}

export {};
