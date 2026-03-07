import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';
import { PermissionRow } from '../models/permission.model';
import { MOCK_PERMISSIONS } from '../features/permission-matrix/mock-data/permission-mock';

@Injectable({
    providedIn: 'root',
})
export class PermissionService {
    private readonly baseUrl = `${getBaseUrl()}/permission-matrix`;

    constructor(private readonly http: HttpClient) { }

    getPermissions(role: string): Observable<ResponseApi<PermissionRow[]>> {
        // Simulated API call with mock data
        return of({
            data: MOCK_PERMISSIONS,
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
