import { Injectable, signal } from '@angular/core';
import { Observable, tap, of } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { GeneralConfig } from '@/models/general-config.model';
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({
    providedIn: 'root',
})
export class GeneralConfigService {
    private _config = signal<GeneralConfig | null>(null);

    constructor(private readonly apiClient: ApiClientService) { }

    get configSignal() {
        return this._config.asReadonly();
    }

    getConfig(): Observable<ResponseApi<GeneralConfig>> {
        if (this._config()) {
            return of({ data: this._config()!, status: { code: '200', message: 'OK' } } as ResponseApi<GeneralConfig>);
        }
        return this.apiClient.get<ResponseApi<GeneralConfig>>(API_ENDPOINTS.systemConfig.general, { skipErrorToast: true }).pipe(
            tap(res => {
                if (res.data) this._config.set(res.data);
            })
        );
    }

    updateConfig(config: GeneralConfig): Observable<ResponseApi<void>> {
        // `GeneralConfigComponent` shows its own feature toast for update errors/success.
        return this.apiClient.put<ResponseApi<void>>(API_ENDPOINTS.systemConfig.general, config, { skipErrorToast: true }).pipe(
            tap(() => this._config.set(null)) // Clear cache on update
        );
    }
}
