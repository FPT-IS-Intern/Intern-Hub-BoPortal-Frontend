import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../../core/config/app-config';
import { SKIP_API_ERROR_TOAST } from '../../core/interceptors/api-error.interceptor';
import {
  UserDetail,
  UserFilterRequest,
  UserListItem,
  UserPageResponse,
} from '../../models/user-management.model';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/users`;
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  filterUsers(
    request: UserFilterRequest,
    page: number,
    size: number,
  ): Observable<ResponseApi<UserPageResponse<UserListItem>>> {
    return this.http.post<ResponseApi<UserPageResponse<UserListItem>>>(
      `${this.baseUrl}/search?page=${page}&size=${size}`,
      request,
      { context: this.noGlobalToastCtx },
    );
  }

  getUserById(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.get<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}`, {
      context: this.noGlobalToastCtx,
    });
  }

  lockUser(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(
      `${this.baseUrl}/${userId}/lock`,
      {},
      { context: this.noGlobalToastCtx },
    );
  }

  unlockUser(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(
      `${this.baseUrl}/${userId}/unlock`,
      {},
      { context: this.noGlobalToastCtx },
    );
  }

  getMetaOptions(): Observable<ResponseApi<{ roles: string[]; positions: string[]; departments: string[] }>> {
    return this.http.get<ResponseApi<{ roles: string[]; positions: string[]; departments: string[] }>>(
      `${this.baseUrl}/meta`,
      { context: this.noGlobalToastCtx },
    );
  }
}
