import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../../core/config/app-config';
import { GeneralConfig } from '../../models/general-config.model';
import { SKIP_API_ERROR_TOAST } from '../../core/interceptors/api-error.interceptor';

@Injectable({
    providedIn: 'root',
})
export class GeneralConfigService {
    private readonly baseUrl = `${getBaseUrl()}/bo-portal/system-config`;
    private _config = signal<GeneralConfig | null>(null);
    private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

    constructor(private readonly http: HttpClient) { }

    get configSignal() {
        return this._config.asReadonly();
    }

    getConfig(): Observable<ResponseApi<GeneralConfig>> {
        if (this._config()) {
            return of({ data: this._config()!, status: { code: '200', message: 'OK' } } as ResponseApi<GeneralConfig>);
        }
        return this.http.get<ResponseApi<GeneralConfig>>(this.baseUrl, { context: this.noGlobalToastCtx }).pipe(
            tap(res => {
                if (res.data) this._config.set(res.data);
            })
        );
    }

    updateConfig(config: GeneralConfig): Observable<ResponseApi<void>> {
        // `GeneralConfigComponent` shows its own feature toast for update errors/success.
        return this.http.put<ResponseApi<void>>(this.baseUrl, config, { context: this.noGlobalToastCtx }).pipe(
            tap(() => this._config.set(null)) // Clear cache on update
        );
    }
}
