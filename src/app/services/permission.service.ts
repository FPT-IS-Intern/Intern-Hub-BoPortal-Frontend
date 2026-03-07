import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
        return this.http.get<ResponseApi<PermissionRow[]>>(`${this.baseUrl}/${role}`);
    }

    updatePermissions(role: string, permissions: PermissionRow[]): Observable<ResponseApi<void>> {
        return this.http.post<ResponseApi<void>>(`${this.baseUrl}/${role}`, permissions);
    }
}
