import { Injectable, signal, inject } from '@angular/core';
import { Observable, finalize, tap, forkJoin, of, catchError, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { GeneralConfigService } from './general-config.service';
import { LogoutRequest, LoginRequest, LoginResponse, BoAdminProfile } from '../models/auth.model';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { StorageUtil } from '../core/utils/storage.util';
import { getBaseUrl } from '../core/config/app-config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly httpClient = inject(HttpClient);
  private readonly configService = inject(GeneralConfigService);

  userProfile = signal<BoAdminProfile | null>(null);

  constructor() {}

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
    return this.httpClient.get<ResponseApi<BoAdminProfile>>(`${getBaseUrl()}/bo-portal/auth/me`).pipe(
      tap((res) => {
        if (res.data) {
          // Robustly extract user object
          let user: any = res.data;
          if ((res.data as any).user) {
            user = (res.data as any).user;
          }
          this.userProfile.set(user);
        }
      }),
    );
  }

  loadInitialData(): Observable<any> {
    return forkJoin({
      profile: this.me().pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('Error fetching profile (/me):', err);
          return throwError(() => err);
        })
      ),
      config: this.configService.getConfig().pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('Error fetching general config:', err);
          return throwError(() => err);
        })
      ),
    }).pipe(
      catchError((err: any) => {
        console.error('loadInitialData failed overall:', err);
        return throwError(() => err);
      })
    );
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
