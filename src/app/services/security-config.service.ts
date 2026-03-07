import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';
import { SecurityConfig } from '../models/security-config.model';

@Injectable({
    providedIn: 'root',
})
export class SecurityConfigService {
    private readonly baseUrl = `${getBaseUrl()}/security-config`;

    constructor(private readonly http: HttpClient) { }

    getConfig(): Observable<ResponseApi<SecurityConfig>> {
        return this.http.get<ResponseApi<SecurityConfig>>(this.baseUrl);
    }

    updateConfig(config: SecurityConfig): Observable<ResponseApi<void>> {
        return this.http.post<ResponseApi<void>>(this.baseUrl, config);
    }
}
