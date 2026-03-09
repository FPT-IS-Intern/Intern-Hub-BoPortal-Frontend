import { Injectable } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LogoutRequest, LoginRequest, LoginResponse, BoAdminProfile } from '../models/auth.model';
import { ResponseApi, StorageUtil } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private readonly httpClient: HttpClient) {}

  login(data: LoginRequest): Observable<ResponseApi<LoginResponse>> {
    const payload: LoginRequest = {
      ...data,
      deviceId: data.deviceId || this.getDeviceId(),
    };

    return this.httpClient.post<ResponseApi<LoginResponse>>(
      `${getBaseUrl()}/bo-portal/auth/login`,
      payload,
    );
  }

  logout(data: LogoutRequest): Observable<ResponseApi<void>> {
    return this.httpClient
      .post<ResponseApi<void>>(`${getBaseUrl()}/bo-portal/auth/logout`, data)
      .pipe(
        finalize(() => {
          StorageUtil.clearAll();
        }),
      );
  }

  refreshAccessToken(data: {
    refreshToken: string;
    deviceId?: string;
  }): Observable<ResponseApi<{ accessToken: string; refreshToken: string }>> {
    const payload = {
      refreshToken: data.refreshToken,
      deviceId: data.deviceId || this.getDeviceId(),
    };

    return this.httpClient.post<ResponseApi<{ accessToken: string; refreshToken: string }>>(
      `${getBaseUrl()}/bo-portal/auth/refresh`,
      payload,
    );
  }

  me(): Observable<ResponseApi<BoAdminProfile>> {
    return this.httpClient.get<ResponseApi<BoAdminProfile>>(`${getBaseUrl()}/bo-portal/auth/me`);
  }

  getDeviceId(): string {
    let deviceId = StorageUtil.getDeviceId();
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      StorageUtil.setDeviceId(deviceId);
    }
    return deviceId;
  }
}
