import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';
import { AuthzRole, AuthzResource, AuthzRolePermission, ResourcePermission } from '../models/authz.model';
import { SKIP_API_ERROR_TOAST } from '../core/interceptors/api-error.interceptor';

@Injectable({ providedIn: 'root' })
export class AuthzService {
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/authz`;
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  constructor(private readonly http: HttpClient) {}

  getRoles(): Observable<ResponseApi<AuthzRole[]>> {
    return this.http.get<ResponseApi<AuthzRole[]>>(`${this.baseUrl}/roles`, { context: this.noGlobalToastCtx });
  }

  createRole(name: string, description: string): Observable<ResponseApi<AuthzRole>> {
    return this.http.post<ResponseApi<AuthzRole>>(
      `${this.baseUrl}/roles`,
      { name, description },
      { context: this.noGlobalToastCtx }
    );
  }

  createResource(name: string, code: string, description: string): Observable<ResponseApi<AuthzResource>> {
    const partial = JSON.stringify({ name, code, description });
    const body = partial.slice(0, -1) + ',"categoryId":"155566777659559936"}';
    return this.http.post<ResponseApi<AuthzResource>>(
      `${this.baseUrl}/resources`,
      body,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }), context: this.noGlobalToastCtx },
    );
  }

  getAllResources(): Observable<ResponseApi<AuthzResource[]>> {
    return this.http.get<ResponseApi<AuthzResource[]>>(`${this.baseUrl}/resources`, { context: this.noGlobalToastCtx });
  }

  getRolePermissions(roleId: string): Observable<ResponseApi<AuthzRolePermission[]>> {
    return this.http.get<ResponseApi<AuthzRolePermission[]>>(
      `${this.baseUrl}/roles/${roleId}/permissions`,
      { context: this.noGlobalToastCtx }
    );
  }

  updateRolePermissions(roleId: string, resources: ResourcePermission[]): Observable<ResponseApi<void>> {
    return this.http.put<ResponseApi<void>>(
      `${this.baseUrl}/roles/${roleId}/permissions`,
      { resources },
      { context: this.noGlobalToastCtx }
    );
  }
}
