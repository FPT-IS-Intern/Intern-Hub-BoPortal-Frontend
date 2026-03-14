import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';
import { SecurityConfig } from '../models/security-config.model';
import { SKIP_API_ERROR_TOAST } from '../core/interceptors/api-error.interceptor';

@Injectable({
    providedIn: 'root',
})
export class SecurityConfigService {
    private readonly baseUrl = `${getBaseUrl()}/bo-portal/security-config`;
    private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

    constructor(private readonly http: HttpClient) { }

    getConfig(): Observable<ResponseApi<SecurityConfig>> {
        return this.http.get<ResponseApi<SecurityConfig>>(this.baseUrl, { context: this.noGlobalToastCtx });
    }

    updateConfig(config: SecurityConfig): Observable<ResponseApi<void>> {
        return this.http.put<ResponseApi<void>>(this.baseUrl, config, { context: this.noGlobalToastCtx });
    }
}
