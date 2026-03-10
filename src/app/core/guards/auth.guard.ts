import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TokenStorageService } from '../../services/token-storage.service';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const tokenService = inject(TokenStorageService);

    if (tokenService.isAuthenticated()) {
        console.log('authGuard: Authenticated. Access granted.');
        return true;
    }

    console.warn('authGuard: Not authenticated. Redirecting to /login...');
    router.navigate(['/login']);
    return false;
};
