import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

// Trigger deploy
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

(globalThis as any).__env = {
  apiUrl: isLocal ? 'http://localhost:8386' : 'https://admin-internhub-v2.bbtech.io.vn',
  storageFileBaseUrl: (environment as any).storageFileBaseUrl,
};

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
