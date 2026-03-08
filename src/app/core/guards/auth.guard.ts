import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TokenStorageService } from '../../services/token-storage.service';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const tokenService = inject(TokenStorageService);

    if (tokenService.isAuthenticated()) {
        return true;
    }

    // Chuyển hướng về login nếu chưa đăng nhập
    router.navigate(['/login']);
    return false;
};
