import { Injectable } from '@angular/core';
import { StorageUtil } from '../core/utils/storage.util';

@Injectable({
    providedIn: 'root',
})
export class TokenStorageService {
    saveTokens(accessToken: string, refreshToken: string): void {
        StorageUtil.setAccessToken(accessToken);
        StorageUtil.setRefreshToken(refreshToken);
    }

    getAccessToken(): string | null {
        return StorageUtil.getAccessToken();
    }

    getRefreshToken(): string | null {
        return StorageUtil.getRefreshToken();
    }

    clearTokens(): void {
        StorageUtil.clearAuthData();
        StorageUtil.clearAll();
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }
}
