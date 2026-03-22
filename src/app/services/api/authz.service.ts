import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { AuthzRole, AuthzResource, AuthzRolePermission, ResourcePermission } from '@/models/authz.model';
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({ providedIn: 'root' })
export class AuthzService {
  constructor(private readonly apiClient: ApiClientService) {}

  getRoles(): Observable<ResponseApi<AuthzRole[]>> {
    return this.apiClient.get<ResponseApi<AuthzRole[]>>(API_ENDPOINTS.authz.roles, { skipErrorToast: true });
  }

  createRole(name: string, description: string): Observable<ResponseApi<AuthzRole>> {
    return this.apiClient.post<ResponseApi<AuthzRole>>(
      API_ENDPOINTS.authz.roles,
      { name, description },
      { skipErrorToast: true }
    );
  }

  createResource(name: string, code: string, description: string): Observable<ResponseApi<AuthzResource>> {
    const partial = JSON.stringify({ name, code, description });
    const body = partial.slice(0, -1) + ',"categoryId":"155566777659559936"}';
    return this.apiClient.post<ResponseApi<AuthzResource>>(
      API_ENDPOINTS.authz.resources,
      body,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }), skipErrorToast: true },
    );
  }

  getAllResources(): Observable<ResponseApi<AuthzResource[]>> {
    return this.apiClient.get<ResponseApi<AuthzResource[]>>(API_ENDPOINTS.authz.resources, { skipErrorToast: true });
  }

  getRolePermissions(roleId: string): Observable<ResponseApi<AuthzRolePermission[]>> {
    return this.apiClient.get<ResponseApi<AuthzRolePermission[]>>(
      API_ENDPOINTS.authz.rolePermissions(roleId),
      { skipErrorToast: true }
    );
  }

  updateRolePermissions(roleId: string, resources: ResourcePermission[]): Observable<ResponseApi<void>> {
    return this.apiClient.put<ResponseApi<void>>(
      API_ENDPOINTS.authz.rolePermissions(roleId),
      { resources },
      { skipErrorToast: true }
    );
  }
}
