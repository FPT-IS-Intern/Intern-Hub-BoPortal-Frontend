import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

// Trigger deploy
(globalThis as any).__env = {
  apiUrl: environment.apiUrl,
  storageFileBaseUrl: (environment as any).storageFileBaseUrl,
};

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
