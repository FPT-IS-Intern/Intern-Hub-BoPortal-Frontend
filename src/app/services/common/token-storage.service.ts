import { Injectable } from '@angular/core';
import { StorageUtil } from '../../core/utils/storage.util';

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
        return !!this.getAccessToken() && !this.isAccessTokenExpired();
    }

    getAccessTokenExpiration(): number | null {
        const token = this.getAccessToken();
        if (!token) return null;
        try {
            const payloadBase64 = token.split('.')[1];
            if (!payloadBase64) return null;
            const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadJson);
            return payload.exp ? payload.exp * 1000 : null; // JWT exp is in seconds
        } catch (e) {
            console.error('Error decoding token:', e);
            return null;
        }
    }

    isAccessTokenExpired(): boolean {
        const exp = this.getAccessTokenExpiration();
        if (!exp) return true;
        return Date.now() >= exp;
    }
}
