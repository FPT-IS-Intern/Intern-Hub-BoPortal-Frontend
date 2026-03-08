import { Injectable } from '@angular/core';
import { Observable, finalize, of, delay } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LogoutRequest, LoginRequest, LoginResponse } from '../models/auth.model';
import { ResponseApi, StorageUtil } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';
import { MOCK_USER, MOCK_LOGIN_RESPONSE } from '../core/mock-data/auth.mock';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private readonly httpClient: HttpClient) { }

  login(data: LoginRequest): Observable<ResponseApi<LoginResponse>> {
    // Logic Mock Login
    if (data.username === MOCK_USER.username && data.password === MOCK_USER.password) {
      return of({
        data: MOCK_LOGIN_RESPONSE,
        status: {
          code: '200',
          message: 'Đăng nhập thành công',
          displayType: 'TOAST'
        },
        timestamp: new Date().toISOString()
      } as any).pipe(delay(1000));
    }

    return of({
      data: null,
      status: {
        code: '401',
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
        displayType: 'TOAST'
      },
      timestamp: new Date().toISOString()
    } as any).pipe(delay(1000));
  }

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
