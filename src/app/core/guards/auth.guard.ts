import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TokenStorageService } from '../../services/common/token-storage.service';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const tokenService = inject(TokenStorageService);

    const accessToken = tokenService.getAccessToken();
    const refreshToken = tokenService.getRefreshToken();

    if (accessToken) {
        console.log('authGuard: Access token found. Access granted.');
        return true;
    }

    // Nếu không có accessToken nhưng có refreshToken, ta có thể cho qua để App.ts tự refresh
    // HOẶC nếu muốn chặn triệt để thì redirect luôn. 
    // Ở đây ta chọn redirect để đảm bảo "chặn ngay việc này" như user yêu cầu.
    if (refreshToken) {
        console.warn('authGuard: No access token but refresh token exists. Redirecting to login for re-auth.');
    } else {
        console.warn('authGuard: No tokens found. Redirecting to /login...');
    }

    tokenService.clearTokens();
    router.navigate(['/login']);
    return false;
};
