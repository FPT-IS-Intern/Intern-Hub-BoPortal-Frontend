const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  DEVICE_ID: 'device_id',
};

export class StorageUtil {
  static getAccessToken(): string | null {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  }

  static setAccessToken(token: string): void {
    localStorage.setItem(KEYS.ACCESS_TOKEN, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(KEYS.REFRESH_TOKEN, token);
  }

  static getDeviceId(): string | null {
    return localStorage.getItem(KEYS.DEVICE_ID);
  }

  static setDeviceId(deviceId: string): void {
    localStorage.setItem(KEYS.DEVICE_ID, deviceId);
  }

  static clearAuthData(): void {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
  }

  static clearAll(): void {
    localStorage.clear();
  }
}

// Token refresh event helpers (replace shared-lib-client events)
export function notifyTokenRefreshed(newAccessToken: string): void {
  window.dispatchEvent(new CustomEvent('TOKEN_REFRESHED', { detail: { accessToken: newAccessToken } }));
}

export function cancelTokenRefresh(): void {
  window.dispatchEvent(new CustomEvent('TOKEN_REFRESH_CANCELLED'));
}
export function notifyAuthTokenExpired(): void {
  window.dispatchEvent(new CustomEvent('AUTH_TOKEN_EXPIRED'));
}

export function notifyForceLogout(): void {
  window.dispatchEvent(new CustomEvent('FORCE_LOGOUT'));
}
