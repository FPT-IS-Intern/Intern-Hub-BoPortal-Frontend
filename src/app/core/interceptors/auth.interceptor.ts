import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../../services/token-storage.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const tokenService = inject(TokenStorageService);
    const router = inject(Router);
    const token = tokenService.getAccessToken();

    let authReq = req;
    if (token) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Dispatch event để app.ts catch và gọi refresh token
                window.dispatchEvent(new Event('AUTH_TOKEN_EXPIRED'));
                console.warn('authInterceptor: 401 nhận được, đã phát sự kiện AUTH_TOKEN_EXPIRED.');
            }
            return throwError(() => error);
        })
    );
};
