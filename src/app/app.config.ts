import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  LOCALE_ID,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import localeVi from '@angular/common/locales/vi';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { apiErrorInterceptor } from './core/interceptors/api-error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

registerLocaleData(localeVi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor, apiErrorInterceptor])),
    provideTranslateService({
      lang: 'vi',
      fallbackLang: 'vi',
    }),
    ...provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
      useHttpBackend: true,
    }),

    { provide: LOCALE_ID, useValue: 'vi' },
  ],
};
