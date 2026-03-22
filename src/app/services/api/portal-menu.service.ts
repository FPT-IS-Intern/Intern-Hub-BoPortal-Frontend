import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { buildApiUrl } from '@/core/config/app-config';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { SKIP_API_ERROR_TOAST } from '@/core/interceptors/api-error.interceptor';
import { PortalMenuItem, PortalMenuRequest } from '@/models/portal-menu.model';

@Injectable({
  providedIn: 'root',
})
export class PortalMenuService {
  private readonly http = inject(HttpClient);
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  getAllMenus(): Observable<ResponseApi<PortalMenuItem[]>> {
    return this.http.get<ResponseApi<PortalMenuItem[]>>(buildApiUrl(API_ENDPOINTS.portalMenus.root), {
      context: this.noGlobalToastCtx,
    });
  }

  getMenuById(id: number): Observable<ResponseApi<PortalMenuItem>> {
    return this.http.get<ResponseApi<PortalMenuItem>>(buildApiUrl(API_ENDPOINTS.portalMenus.byId(id)), {
      context: this.noGlobalToastCtx,
    });
  }

  createMenu(request: PortalMenuRequest): Observable<ResponseApi<PortalMenuItem>> {
    return this.http.post<ResponseApi<PortalMenuItem>>(buildApiUrl(API_ENDPOINTS.portalMenus.root), request, {
      context: this.noGlobalToastCtx,
    });
  }

  updateMenu(id: number, request: PortalMenuRequest): Observable<ResponseApi<PortalMenuItem>> {
    return this.http.put<ResponseApi<PortalMenuItem>>(buildApiUrl(API_ENDPOINTS.portalMenus.byId(id)), request, {
      context: this.noGlobalToastCtx,
    });
  }

  deleteMenu(id: number): Observable<ResponseApi<void>> {
    return this.http.delete<ResponseApi<void>>(buildApiUrl(API_ENDPOINTS.portalMenus.byId(id)), {
      context: this.noGlobalToastCtx,
    });
  }
}
