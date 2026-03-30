import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TokenStorageService } from '@/services/common/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const tokenService = inject(TokenStorageService);
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
                // Xử lý khi token hết hạn hoặc không hợp lệ
                // Không tự động chuyển về /login, chỉ báo lỗi để UI quyết định.
                tokenService.clearTokens();
                console.warn('authInterceptor: 401 nhận được, giữ trên trang hiện tại.');
            }
            return throwError(() => error);
        })
    );
};
