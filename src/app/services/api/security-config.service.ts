import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { SecurityConfig } from '@/models/security-config.model';
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({
    providedIn: 'root',
})
export class SecurityConfigService {
    constructor(private readonly apiClient: ApiClientService) { }

    getConfig(): Observable<ResponseApi<SecurityConfig>> {
        return this.apiClient.get<ResponseApi<SecurityConfig>>(API_ENDPOINTS.systemConfig.security, { skipErrorToast: true });
    }

    updateConfig(config: SecurityConfig): Observable<ResponseApi<void>> {
        return this.apiClient.put<ResponseApi<void>>(API_ENDPOINTS.systemConfig.security, config, { skipErrorToast: true });
    }
}
