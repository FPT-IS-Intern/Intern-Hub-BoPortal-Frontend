import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';
import { AuthzRole, AuthzResource, ResourcePermission } from '../models/authz.model';

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
    // categoryId bypass: 155566777659559936 exceeds Number.MAX_SAFE_INTEGER,
    // so we inject it as a raw JSON number to avoid precision loss.
    const partial = JSON.stringify({ name, code, description });
    const body = partial.slice(0, -1) + ',"categoryId":155566777659559936}';
    return this.http.post<ResponseApi<AuthzResource>>(
      `${this.baseUrl}/resources`,
      body,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
    );
  }

  updateRolePermissions(roleId: number, resources: ResourcePermission[]): Observable<ResponseApi<void>> {
    return this.http.put<ResponseApi<void>>(
      `${this.baseUrl}/roles/${roleId}/permissions`,
      { resources },
    );
  }
}
