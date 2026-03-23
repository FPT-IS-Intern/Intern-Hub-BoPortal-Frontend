import { Injectable, signal, inject } from '@angular/core';
import { Observable, finalize, tap, forkJoin, of, catchError, throwError, map, shareReplay, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { GeneralConfigService } from './general-config.service';
import { AuthTokenPair, BoAdminProfile, BoAdminProfileResponse, LoginPayload, LoginRequest, LoginResponse, LogoutRequest, PublicKeyPayload } from '@/models/auth.model';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { StorageUtil } from '@/core/utils/storage.util';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { encryptWithRsaPublicKey } from '@/core/utils/rsa.util';
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiClient = inject(ApiClientService);
  private readonly configService = inject(GeneralConfigService);
  private loginPublicKey$: Observable<string> | null = null;
  private loginPublicKeyValue: string | null = null;

  userProfile = signal<BoAdminProfile | null>(null);

  constructor() {}

  login(data: LoginRequest): Observable<ResponseApi<LoginResponse>> {
    if (!data.username) {
      return throwError(() => new Error('Username is required'));
    }

    if (!data.password) {
      return throwError(() => new Error('Password is required'));
    }

    const deviceId = data.deviceId || this.getDeviceId();
    return this.getLoginPublicKey().pipe(
      map((publicKey) => ({
        encryptedUsername: encryptWithRsaPublicKey(data.username, publicKey),
        encryptedPassword: encryptWithRsaPublicKey(data.password as string, publicKey),
      })),
      switchMap(({ encryptedUsername, encryptedPassword }) => {
        const payload: LoginPayload = {
          encryptedUsername,
          encryptedPassword,
          deviceId,
        };
        return this.apiClient.post<ResponseApi<LoginResponse>>(API_ENDPOINTS.auth.login, payload);
      }),
    );
  }

  logout(data: LogoutRequest): Observable<ResponseApi<void>> {
    return this.apiClient
      .post<ResponseApi<void>>(API_ENDPOINTS.auth.logout, data)
      .pipe(
        finalize(() => {
          StorageUtil.clearAll();
        }),
      );
  }

  refreshAccessToken(data: {
    refreshToken: string;
    deviceId?: string;
  }): Observable<ResponseApi<AuthTokenPair>> {
    const payload = {
      refreshToken: data.refreshToken,
      deviceId: data.deviceId || this.getDeviceId(),
    };

    return this.apiClient.post<ResponseApi<AuthTokenPair>>(
      API_ENDPOINTS.auth.refresh,
      payload,
      { headers: { 'X-Skip-Loading': 'true' } }
    );
  }

  me(): Observable<ResponseApi<BoAdminProfileResponse>> {
    return this.apiClient.get<ResponseApi<BoAdminProfileResponse>>(API_ENDPOINTS.auth.me, {
      headers: { 'X-Skip-Loading': 'true' }
    }).pipe(
      tap((res) => {
        if (res.data) {
          this.userProfile.set(res.data.user ?? res.data);
        }
      }),
    );
  }


  loadInitialData(): Observable<{ profile: ResponseApi<BoAdminProfileResponse>; config: unknown }> {
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
      catchError((err: unknown) => {
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

  private getLoginPublicKey(): Observable<string> {
    if (this.loginPublicKeyValue) {
      return of(this.loginPublicKeyValue);
    }
    if (!this.loginPublicKey$) {
      this.loginPublicKey$ = this.apiClient
        .get<ResponseApi<string | PublicKeyPayload>>(API_ENDPOINTS.auth.publicKey)
        .pipe(
          map((res) => {
            const key = this.extractPublicKey(res.data);
            if (!key) {
              throw new Error('Login public key is empty');
            }
            this.loginPublicKeyValue = key;
            return key;
          }),
          catchError((error) => {
            this.loginPublicKey$ = null;
            this.loginPublicKeyValue = null;
            return throwError(() => error);
          }),
          shareReplay(1),
        );
    }
    return this.loginPublicKey$;
  }

  private extractPublicKey(data: string | PublicKeyPayload | null | undefined): string {
    if (typeof data === 'string') {
      return data;
    }

    if (data && typeof data === 'object') {
      return data.publicKey || data.key || '';
    }

    return '';
  }
}
