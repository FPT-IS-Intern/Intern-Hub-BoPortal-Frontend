import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TokenStorageService } from '@/services/common/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenStorageService);
  const token = tokenService.getAccessToken();

  // Treat known third-party services as external and avoid attaching auth headers.
  const externalDomains = ['ipify.org', 'jsonip.com', 'ipinfo.io', 'maps.googleapis.com'];
  const isExternal = externalDomains.some((domain) => req.url.includes(domain));
  const isInternalApi = !isExternal || req.url.startsWith('/');

  let authReq = req;
  if (token && isInternalApi) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        import('../utils/storage.util').then((storageUtil) => storageUtil.notifyAuthTokenExpired());
        console.warn('authInterceptor: 401 received, dispatching AUTH_TOKEN_EXPIRED.');
      }

      return throwError(() => error);
    }),
  );
};
