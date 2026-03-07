import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';
import { GeneralConfig } from '../models/general-config.model';

@Injectable({
    providedIn: 'root',
})
export class GeneralConfigService {
    private readonly baseUrl = `${getBaseUrl()}/general-config`;

    constructor(private readonly http: HttpClient) { }

    getConfig(): Observable<ResponseApi<GeneralConfig>> {
        return this.http.get<ResponseApi<GeneralConfig>>(this.baseUrl);
    }

    updateConfig(config: GeneralConfig): Observable<ResponseApi<void>> {
        return this.http.post<ResponseApi<void>>(this.baseUrl, config);
    }
}
