import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { buildApiUrl } from '@/core/config/app-config';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { SKIP_API_ERROR_TOAST } from '@/core/interceptors/api-error.interceptor';
import {
  SystemConfiguration,
  SystemConfigUpdateRequest,
  SecurityConfigUpdateRequest,
} from '@/models/system-configuration.model';
import { GeneralConfig } from '@/models/general-config.model';
import { SecurityConfig } from '@/models/security-config.model';

@Injectable({
  providedIn: 'root',
})
export class SystemConfigurationService {
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  constructor(private readonly http: HttpClient) {}

  getSystemConfiguration(): Observable<ResponseApi<SystemConfiguration>> {
    return this.http.get<ResponseApi<SystemConfiguration>>(buildApiUrl(API_ENDPOINTS.systemConfig.composite), { context: this.noGlobalToastCtx });
  }

  updateSystemConfig(payload: SystemConfigUpdateRequest): Observable<ResponseApi<SystemConfiguration>> {
    return this.http.put<ResponseApi<SystemConfiguration>>(buildApiUrl(API_ENDPOINTS.systemConfig.compositeSystem), payload, {
      context: this.noGlobalToastCtx,
    });
  }

  updateSecurityConfig(payload: SecurityConfigUpdateRequest): Observable<ResponseApi<SecurityConfig>> {
    return this.http.put<ResponseApi<SecurityConfig>>(buildApiUrl(API_ENDPOINTS.systemConfig.compositeSecurity), payload, {
      context: this.noGlobalToastCtx,
    });
  }
}
