import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  LOCALE_ID,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor, configureAuthInterceptor } from '@goat-bravos/shared-lib-client';
import { SYSTEM_DESIGN_CONFIG } from 'dynamic-ds';
import { NZ_I18N, vi_VN } from 'ng-zorro-antd/i18n';
import localeVi from '@angular/common/locales/vi';

import { routes } from './app.routes';

registerLocaleData(localeVi);

/**
 * Cấu hình danh sách path KHÔNG gắn Bearer token.
 * Tất cả path được quản lý tập trung tại đây.
 */
configureAuthInterceptor({
  excludedPaths: [
    '/auth/refresh',
  ],
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor as unknown as HttpInterceptorFn])),
    { provide: NZ_I18N, useValue: vi_VN },
    { provide: LOCALE_ID, useValue: 'vi' },
    {
      provide: SYSTEM_DESIGN_CONFIG,
      useValue: {
        brand: '#E18308',
        primary: '#006BDF',
        secondary: '#9F5100',
        functional: '#006BDF',
        utility: '#CF0026',
      },
    },
  ],
};
