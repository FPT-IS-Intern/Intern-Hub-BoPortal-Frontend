import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';
import { GeneralConfig } from '../models/general-config.model';

@Injectable({
    providedIn: 'root',
})
export class GeneralConfigService {
    private readonly baseUrl = `${getBaseUrl()}/bo-portal/system-config`;
    private _config = signal<GeneralConfig | null>(null);

    constructor(private readonly http: HttpClient) { }

    get configSignal() {
        return this._config.asReadonly();
    }

    getConfig(): Observable<ResponseApi<GeneralConfig>> {
        if (this._config()) {
            return of({ data: this._config()!, status: { code: '200', message: 'OK' } } as ResponseApi<GeneralConfig>);
        }
        return this.http.get<ResponseApi<GeneralConfig>>(this.baseUrl).pipe(
            tap(res => {
                if (res.data) this._config.set(res.data);
            })
        );
    }

    updateConfig(config: GeneralConfig): Observable<ResponseApi<void>> {
        return this.http.post<ResponseApi<void>>(this.baseUrl, config).pipe(
            tap(() => this._config.set(null)) // Clear cache on update
        );
    }
}
