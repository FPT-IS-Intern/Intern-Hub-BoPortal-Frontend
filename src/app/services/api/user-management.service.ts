import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../../core/config/app-config';
import { SKIP_API_ERROR_TOAST } from '../../core/interceptors/api-error.interceptor';
import { environment } from '../../../environments/environment';
import {
  UserHistoryRecord,
  UserDetail,
  UserFilterRequest,
  UserListItem,
  UserOrganizationUpdateRequest,
  UserPageResponse,
  UserRoleUpdateRequest,
  UserUpsertRequest,
} from '../../models/user-management.model';
import {
  activateMockUser,
  assignRoleMockUser,
  createMockUser,
  deactivateMockUser,
  deleteMockUser,
  filterMockUsers,
  getMockActivityHistory,
  getMockUserDetail,
  getMockUserMeta,
  getMockLoginHistory,
  lockMockUser,
  resendActivationEmailMockUser,
  restoreMockUser,
  unlockMockUser,
  updateMockUser,
  updateOrganizationMockUser,
  resetPasswordMockUser,
} from '../../core/mocks/user-management.mock';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/users`;
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  private mockResponse<T>(data: T): Observable<ResponseApi<T>> {
    return of({
      data,
      message: 'Success (Mock)',
      status: 200 as any,
      metaData: {},
    });
  }

  private mockNotFound(userId: number): Observable<never> {
    return throwError(() => new Error(`Mock user ${userId} not found`));
  }

  filterUsers(
    request: UserFilterRequest,
    page: number,
    size: number,
  ): Observable<ResponseApi<UserPageResponse<UserListItem>>> {
    if (environment.useMock) {
      return this.mockResponse(filterMockUsers(request, page, size));
    }

    return this.http.post<ResponseApi<UserPageResponse<UserListItem>>>(
      `${this.baseUrl}/search?page=${page}&size=${size}`,
      request,
      { context: this.noGlobalToastCtx },
    );
  }

  getUserById(userId: number): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = getMockUserDetail(userId);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.get<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}`, {
      context: this.noGlobalToastCtx,
    });
  }

  lockUser(userId: number): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = lockMockUser(userId);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.put<ResponseApi<UserDetail>>(
      `${this.baseUrl}/${userId}/lock`,
      {},
      { context: this.noGlobalToastCtx },
    );
  }

  unlockUser(userId: number): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = unlockMockUser(userId);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.put<ResponseApi<UserDetail>>(
      `${this.baseUrl}/${userId}/unlock`,
      {},
      { context: this.noGlobalToastCtx },
    );
  }

  getMetaOptions(): Observable<ResponseApi<{ roles: string[]; positions: string[]; departments: string[] }>> {
    if (environment.useMock) {
      return this.mockResponse(getMockUserMeta());
    }

    return this.http.get<ResponseApi<{ roles: string[]; positions: string[]; departments: string[] }>>(
      `${this.baseUrl}/meta`,
      { context: this.noGlobalToastCtx },
    );
  }

  createUser(request: UserUpsertRequest): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      return this.mockResponse(createMockUser(request));
    }

    return this.http.post<ResponseApi<UserDetail>>(this.baseUrl, request, { context: this.noGlobalToastCtx });
  }

  updateUser(userId: number, request: UserUpsertRequest): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = updateMockUser(userId, request);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}`, request, { context: this.noGlobalToastCtx });
  }

  activateUser(userId: number): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = activateMockUser(userId);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/activate`, {}, { context: this.noGlobalToastCtx });
  }

  deactivateUser(userId: number): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = deactivateMockUser(userId);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/deactivate`, {}, { context: this.noGlobalToastCtx });
  }

  deleteUser(userId: number): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = deleteMockUser(userId);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.delete<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}`, { context: this.noGlobalToastCtx });
  }

  restoreUser(userId: number): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = restoreMockUser(userId);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/restore`, {}, { context: this.noGlobalToastCtx });
  }

  assignRole(userId: number, request: UserRoleUpdateRequest): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = assignRoleMockUser(userId, request);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/role`, request, { context: this.noGlobalToastCtx });
  }

  updateOrganization(userId: number, request: UserOrganizationUpdateRequest): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = updateOrganizationMockUser(userId, request);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/organization`, request, { context: this.noGlobalToastCtx });
  }

  resetPassword(userId: number): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = resetPasswordMockUser(userId);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.post<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/reset-password`, {}, { context: this.noGlobalToastCtx });
  }

  resendActivationEmail(userId: number): Observable<ResponseApi<UserDetail>> {
    if (environment.useMock) {
      const detail = resendActivationEmailMockUser(userId);
      return detail ? this.mockResponse(detail) : this.mockNotFound(userId);
    }

    return this.http.post<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/resend-activation`, {}, { context: this.noGlobalToastCtx });
  }

  getActivityHistory(userId: number): Observable<ResponseApi<UserHistoryRecord[]>> {
    if (environment.useMock) {
      return this.mockResponse(getMockActivityHistory(userId));
    }

    return this.http.get<ResponseApi<UserHistoryRecord[]>>(`${this.baseUrl}/${userId}/activity-history`, { context: this.noGlobalToastCtx });
  }

  getLoginHistory(userId: number): Observable<ResponseApi<UserHistoryRecord[]>> {
    if (environment.useMock) {
      return this.mockResponse(getMockLoginHistory(userId));
    }

    return this.http.get<ResponseApi<UserHistoryRecord[]>>(`${this.baseUrl}/${userId}/login-history`, { context: this.noGlobalToastCtx });
  }
}
