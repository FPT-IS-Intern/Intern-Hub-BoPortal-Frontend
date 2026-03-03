import { Injectable } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LogoutRequest } from '../models/auth.model';
import { ResponseApi, StorageUtil } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private readonly httpClient: HttpClient) {}

  logout(data: LogoutRequest): Observable<ResponseApi<void>> {
    const headers = new HttpHeaders({
      'X-Device-ID': this.getDeviceId(),
    });

    return this.httpClient
      .post<ResponseApi<void>>(`${getBaseUrl()}/auth/logout`, data, {
        headers,
      })
      .pipe(
        finalize(() => {
          StorageUtil.clearAll();
        }),
      );
  }

  refreshAccessToken(data: {
    refreshToken: string;
  }): Observable<ResponseApi<{ accessToken: string; refreshToken: string }>> {
    const headers = new HttpHeaders({
      'X-Device-ID': this.getDeviceId(),
    });

    return this.httpClient.post<ResponseApi<{ accessToken: string; refreshToken: string }>>(
      `${getBaseUrl()}/auth/refresh`,
      data,
      { headers },
    );
  }

  private getDeviceId(): string {
    let deviceId = StorageUtil.getDeviceId();
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      StorageUtil.setDeviceId(deviceId);
    }
    return deviceId;
  }
}
