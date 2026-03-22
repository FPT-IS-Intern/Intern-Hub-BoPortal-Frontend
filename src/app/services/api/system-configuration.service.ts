import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import {
  SystemConfiguration,
  SystemConfigUpdateRequest,
  SecurityConfigUpdateRequest,
} from '@/models/system-configuration.model';
import { SecurityConfig } from '@/models/security-config.model';
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({
  providedIn: 'root',
})
export class SystemConfigurationService {
  constructor(private readonly apiClient: ApiClientService) {}

  getSystemConfiguration(): Observable<ResponseApi<SystemConfiguration>> {
    return this.apiClient.get<ResponseApi<SystemConfiguration>>(API_ENDPOINTS.systemConfig.composite, { skipErrorToast: true });
  }

  updateSystemConfig(payload: SystemConfigUpdateRequest): Observable<ResponseApi<SystemConfiguration>> {
    return this.apiClient.put<ResponseApi<SystemConfiguration>>(API_ENDPOINTS.systemConfig.compositeSystem, payload, {
      skipErrorToast: true,
    });
  }

  updateSecurityConfig(payload: SecurityConfigUpdateRequest): Observable<ResponseApi<SecurityConfig>> {
    return this.apiClient.put<ResponseApi<SecurityConfig>>(API_ENDPOINTS.systemConfig.compositeSecurity, payload, {
      skipErrorToast: true,
    });
  }
}
