import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';
import { PermissionRow } from '../models/permission.model';


@Injectable({
    providedIn: 'root',
})
export class PermissionService {
    private readonly baseUrl = `${getBaseUrl()}/permission-matrix`;

    constructor(private readonly http: HttpClient) { }

    getPermissions(role: string): Observable<ResponseApi<PermissionRow[]>> {
        // API call to get permissions
        return of({
            data: [],
            status: 200,
            timestamp: new Date().toISOString()
        } as any).pipe(delay(500));
    }

    updatePermissions(role: string, permissions: PermissionRow[]): Observable<ResponseApi<void>> {
        // Simulated API call
        return of({
            data: null,
            status: 200,
            timestamp: new Date().toISOString()
        } as any).pipe(delay(500));
    }
}
