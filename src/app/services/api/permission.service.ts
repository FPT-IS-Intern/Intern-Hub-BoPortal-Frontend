import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { ApiStatus, ResponseApi } from '@goat-bravos/shared-lib-client';
import { buildApiUrl } from '@/core/config/app-config';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { PermissionRow } from '@/models/permission.model';


@Injectable({
    providedIn: 'root',
})
export class PermissionService {
    private readonly baseUrl = buildApiUrl(API_ENDPOINTS.permissionMatrix.root);
    private readonly successStatus: ApiStatus = {
        code: '200',
        message: 'OK',
    };

    constructor(private readonly http: HttpClient) { }

    getPermissions(role: string): Observable<ResponseApi<PermissionRow[]>> {
        // API call to get permissions
        return of<ResponseApi<PermissionRow[]>>({
            data: [],
            status: this.successStatus,
            metaData: null,
        }).pipe(delay(500));
    }

    updatePermissions(role: string, permissions: PermissionRow[]): Observable<ResponseApi<void>> {
        // Simulated API call
        return of<ResponseApi<void>>({
            data: null,
            status: this.successStatus,
            metaData: null,
        }).pipe(delay(500));
    }
}
