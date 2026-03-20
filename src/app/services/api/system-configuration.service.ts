import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../../core/config/app-config';
import { SKIP_API_ERROR_TOAST } from '../../core/interceptors/api-error.interceptor';
import {
  SystemConfiguration,
  SystemConfigUpdateRequest,
  SecurityConfigUpdateRequest,
} from '../../models/system-configuration.model';
import { GeneralConfig } from '../../models/general-config.model';
import { SecurityConfig } from '../../models/security-config.model';

@Injectable({
  providedIn: 'root',
})
export class SystemConfigurationService {
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/system-configurations`;
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  constructor(private readonly http: HttpClient) {}

  getSystemConfiguration(): Observable<ResponseApi<SystemConfiguration>> {
    return this.http.get<ResponseApi<SystemConfiguration>>(this.baseUrl, { context: this.noGlobalToastCtx });
  }

  updateSystemConfig(payload: SystemConfigUpdateRequest): Observable<ResponseApi<SystemConfiguration>> {
    return this.http.put<ResponseApi<SystemConfiguration>>(`${this.baseUrl}/system`, payload, {
      context: this.noGlobalToastCtx,
    });
  }

  updateSecurityConfig(payload: SecurityConfigUpdateRequest): Observable<ResponseApi<SecurityConfig>> {
    return this.http.put<ResponseApi<SecurityConfig>>(`${this.baseUrl}/security`, payload, {
      context: this.noGlobalToastCtx,
    });
  }
}
