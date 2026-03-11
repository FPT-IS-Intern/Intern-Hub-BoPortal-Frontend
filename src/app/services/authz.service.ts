import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';
import { AuthzRole, AuthzResource, AuthzRolePermission, ResourcePermission } from '../models/authz.model';

@Injectable({ providedIn: 'root' })
export class AuthzService {
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/authz`;

  constructor(private readonly http: HttpClient) {}

  getRoles(): Observable<ResponseApi<AuthzRole[]>> {
    return this.http.get<ResponseApi<AuthzRole[]>>(`${this.baseUrl}/roles`);
  }

  createRole(name: string, description: string): Observable<ResponseApi<AuthzRole>> {
    return this.http.post<ResponseApi<AuthzRole>>(`${this.baseUrl}/roles`, { name, description });
  }

  createResource(name: string, code: string, description: string): Observable<ResponseApi<AuthzResource>> {
    const partial = JSON.stringify({ name, code, description });
    const body = partial.slice(0, -1) + ',"categoryId":"155566777659559936"}';
    return this.http.post<ResponseApi<AuthzResource>>(
      `${this.baseUrl}/resources`,
      body,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
    );
  }

  getAllResources(): Observable<ResponseApi<AuthzResource[]>> {
    return this.http.get<ResponseApi<AuthzResource[]>>(`${this.baseUrl}/resources`);
  }

  getRolePermissions(roleId: string): Observable<ResponseApi<AuthzRolePermission[]>> {
    return this.http.get<ResponseApi<AuthzRolePermission[]>>(`${this.baseUrl}/roles/${roleId}/permissions`);
  }

  updateRolePermissions(roleId: string, resources: ResourcePermission[]): Observable<ResponseApi<void>> {
    return this.http.put<ResponseApi<void>>(
      `${this.baseUrl}/roles/${roleId}/permissions`,
      { resources },
    );
  }
}
