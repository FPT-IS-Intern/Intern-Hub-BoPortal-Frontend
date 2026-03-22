import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '@/services/common/token-storage.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const tokenService = inject(TokenStorageService);
    const router = inject(Router);
    const token = tokenService.getAccessToken();
    
    // Identifies if the request is to our own API
    // - Relative URLs (starting with /)
    // - Absolute URLs that DON'T match known external service domains
    const externalDomains = ['ipify.org', 'jsonip.com', 'ipinfo.io', 'maps.googleapis.com'];
    const isExternal = externalDomains.some(domain => req.url.includes(domain));
    const isInternalApi = !isExternal || req.url.startsWith('/');

    let authReq = req;
    if (token && isInternalApi) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Xử lý khi token hết hạn hoặc không hợp lệ
                // Phát sự kiện AUTH_TOKEN_EXPIRED để App xử lý (refresh hoặc logout)
                import('../utils/storage.util').then(u => u.notifyAuthTokenExpired());
                console.warn('authInterceptor: 401 received, dispatching AUTH_TOKEN_EXPIRED.');
            }
            return throwError(() => error);
        })
    );
};
