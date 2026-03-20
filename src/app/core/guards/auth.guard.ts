import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TokenStorageService } from '../../services/common/token-storage.service';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const tokenService = inject(TokenStorageService);

    const accessToken = tokenService.getAccessToken();
    const refreshToken = tokenService.getRefreshToken();

    if (tokenService.isAuthenticated()) {
        console.log('authGuard: Token is valid. Access granted.');
        return true;
    }

    tokenService.clearTokens();
    router.navigate(['/login']);
    return false;
};
