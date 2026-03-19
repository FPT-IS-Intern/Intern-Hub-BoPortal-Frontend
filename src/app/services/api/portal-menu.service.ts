import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../../core/config/app-config';
import { SKIP_API_ERROR_TOAST } from '../../core/interceptors/api-error.interceptor';
import { PortalMenuItem, PortalMenuRequest } from '../../models/portal-menu.model';

@Injectable({
  providedIn: 'root',
})
export class PortalMenuService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/menus`;
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  getAllMenus(): Observable<ResponseApi<PortalMenuItem[]>> {
    return this.http.get<ResponseApi<PortalMenuItem[]>>(this.baseUrl, {
      context: this.noGlobalToastCtx,
    });
  }

  getMenuById(id: number): Observable<ResponseApi<PortalMenuItem>> {
    return this.http.get<ResponseApi<PortalMenuItem>>(`${this.baseUrl}/${id}`, {
      context: this.noGlobalToastCtx,
    });
  }

  createMenu(request: PortalMenuRequest): Observable<ResponseApi<PortalMenuItem>> {
    return this.http.post<ResponseApi<PortalMenuItem>>(this.baseUrl, request, {
      context: this.noGlobalToastCtx,
    });
  }

  updateMenu(id: number, request: PortalMenuRequest): Observable<ResponseApi<PortalMenuItem>> {
    return this.http.put<ResponseApi<PortalMenuItem>>(`${this.baseUrl}/${id}`, request, {
      context: this.noGlobalToastCtx,
    });
  }

  deleteMenu(id: number): Observable<ResponseApi<void>> {
    return this.http.delete<ResponseApi<void>>(`${this.baseUrl}/${id}`, {
      context: this.noGlobalToastCtx,
    });
  }
}
