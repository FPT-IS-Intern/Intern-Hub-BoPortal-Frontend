import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../../core/config/app-config';
import { SKIP_API_ERROR_TOAST } from '../../core/interceptors/api-error.interceptor';
import {
  AssignRoleRequest,
  AuthzRole,
  DetachRoleRequest,
  UserDetail,
  UserFilterRequest,
  UserHistoryRecord,
  UserListItem,
  UserOrganizationUpdateRequest,
  UserPageResponse,
  UserProfileUpdateRequest,
  UserRejectRequest,
  UserRoleResponse,
  UserRoleUpdateRequest,
  UserSuspendRequest,
  UserUpsertRequest,
} from '../../models/user-management.model';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/users`;
  private readonly authzUrl = `${getBaseUrl()}/bo-portal/authz`;
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  filterUsers(request: UserFilterRequest, page: number, size: number): Observable<ResponseApi<UserPageResponse<UserListItem>>> {
    return this.http.post<ResponseApi<UserPageResponse<UserListItem>>>(
      `${this.baseUrl}/search?page=${page}&size=${size}`, request, { context: this.noGlobalToastCtx },
    );
  }

  getUserById(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.get<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}`, { context: this.noGlobalToastCtx });
  }

  getMetaOptions(): Observable<ResponseApi<{ roles: string[]; positions: string[]; departments: string[] }>> {
    return this.http.get<ResponseApi<{ roles: string[]; positions: string[]; departments: string[] }>>(
      `${this.baseUrl}/meta`, { context: this.noGlobalToastCtx },
    );
  }

  // --- Lifecycle Actions ---

  approveUser(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/approve`, {}, { context: this.noGlobalToastCtx });
  }

  rejectUser(userId: number, request: UserRejectRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/reject`, request, { context: this.noGlobalToastCtx });
  }

  suspendUser(userId: number, request: UserSuspendRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/suspend`, request, { context: this.noGlobalToastCtx });
  }

  reactivateUser(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/reactivate`, {}, { context: this.noGlobalToastCtx });
  }

  // --- Login Access ---

  lockUser(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/lock`, {}, { context: this.noGlobalToastCtx });
  }

  unlockUser(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/unlock`, {}, { context: this.noGlobalToastCtx });
  }

  resetPassword(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.post<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/reset-password`, {}, { context: this.noGlobalToastCtx });
  }

  resendActivationEmail(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.post<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/resend-activation`, {}, { context: this.noGlobalToastCtx });
  }

  // --- Profile ---

  updateProfile(userId: number, request: UserProfileUpdateRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.patch<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/profile`, request, { context: this.noGlobalToastCtx });
  }

  assignMentor(userId: number, mentorId: number): Observable<ResponseApi<{ userId: number; mentorId: number }>> {
    return this.http.patch<ResponseApi<{ userId: number; mentorId: number }>>(
      `${this.baseUrl}/${userId}/mentor/${mentorId}`, {}, { context: this.noGlobalToastCtx },
    );
  }

  // --- Role Management ---

  getUserRoles(userId: number): Observable<ResponseApi<UserRoleResponse>> {
    return this.http.get<ResponseApi<UserRoleResponse>>(`${this.baseUrl}/${userId}/role`, { context: this.noGlobalToastCtx });
  }

  assignRoleById(userId: number, request: AssignRoleRequest): Observable<ResponseApi<UserRoleResponse>> {
    return this.http.put<ResponseApi<UserRoleResponse>>(`${this.baseUrl}/${userId}/role`, request, { context: this.noGlobalToastCtx });
  }

  detachRole(userId: number, request: DetachRoleRequest): Observable<ResponseApi<UserRoleResponse>> {
    return this.http.delete<ResponseApi<UserRoleResponse>>(`${this.baseUrl}/${userId}/role`, {
      body: request, context: this.noGlobalToastCtx,
    });
  }

  // --- Authz ---

  getAuthzRoles(): Observable<ResponseApi<AuthzRole[]>> {
    return this.http.get<ResponseApi<AuthzRole[]>>(`${this.authzUrl}/roles`, { context: this.noGlobalToastCtx });
  }

  // --- Legacy methods (kept for compatibility) ---

  createUser(request: UserUpsertRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.post<ResponseApi<UserDetail>>(this.baseUrl, request, { context: this.noGlobalToastCtx });
  }

  updateUser(userId: number, request: UserUpsertRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}`, request, { context: this.noGlobalToastCtx });
  }

  activateUser(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/activate`, {}, { context: this.noGlobalToastCtx });
  }

  deactivateUser(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/deactivate`, {}, { context: this.noGlobalToastCtx });
  }

  deleteUser(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.delete<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}`, { context: this.noGlobalToastCtx });
  }

  restoreUser(userId: number): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/restore`, {}, { context: this.noGlobalToastCtx });
  }

  assignRole(userId: number, request: UserRoleUpdateRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/role`, request, { context: this.noGlobalToastCtx });
  }

  updateOrganization(userId: number, request: UserOrganizationUpdateRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(`${this.baseUrl}/${userId}/organization`, request, { context: this.noGlobalToastCtx });
  }

  getActivityHistory(userId: number): Observable<ResponseApi<UserHistoryRecord[]>> {
    return this.http.get<ResponseApi<UserHistoryRecord[]>>(`${this.baseUrl}/${userId}/activity-history`, { context: this.noGlobalToastCtx });
  }

  getLoginHistory(userId: number): Observable<ResponseApi<UserHistoryRecord[]>> {
    return this.http.get<ResponseApi<UserHistoryRecord[]>>(`${this.baseUrl}/${userId}/login-history`, { context: this.noGlobalToastCtx });
  }
}
