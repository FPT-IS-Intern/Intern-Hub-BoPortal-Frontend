import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { PortalMenuItem, PortalMenuRequest } from '@/models/portal-menu.model';
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({
  providedIn: 'root',
})
export class PortalMenuService {
  private readonly apiClient = inject(ApiClientService);

  getAllMenus(): Observable<ResponseApi<PortalMenuItem[]>> {
    return this.apiClient.get<ResponseApi<PortalMenuItem[]>>(API_ENDPOINTS.portalMenus.root, { skipErrorToast: true });
  }

  getMenuById(id: number): Observable<ResponseApi<PortalMenuItem>> {
    return this.apiClient.get<ResponseApi<PortalMenuItem>>(API_ENDPOINTS.portalMenus.byId(id), { skipErrorToast: true });
  }

  createMenu(request: PortalMenuRequest): Observable<ResponseApi<PortalMenuItem>> {
    return this.apiClient.post<ResponseApi<PortalMenuItem>>(API_ENDPOINTS.portalMenus.root, request, { skipErrorToast: true });
  }

  updateMenu(id: number, request: PortalMenuRequest): Observable<ResponseApi<PortalMenuItem>> {
    return this.apiClient.put<ResponseApi<PortalMenuItem>>(API_ENDPOINTS.portalMenus.byId(id), request, { skipErrorToast: true });
  }

  deleteMenu(id: number): Observable<ResponseApi<void>> {
    return this.apiClient.delete<ResponseApi<void>>(API_ENDPOINTS.portalMenus.byId(id), { skipErrorToast: true });
  }
}
