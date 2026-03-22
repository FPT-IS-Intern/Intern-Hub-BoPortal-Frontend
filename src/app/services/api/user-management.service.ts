import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { buildApiUrl } from '@/core/config/app-config';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { SKIP_API_ERROR_TOAST } from '@/core/interceptors/api-error.interceptor';
import {
  AssignRoleRequest,
  AuthzRole,
  DetachRoleRequest,
  UserDetail,
  UserFilterRequest,
  UserHistoryRecord,
  UserId,
  UserListItem,
  UserOrganizationUpdateRequest,
  UserPageResponse,
  UserProfileUpdateRequest,
  UserRejectRequest,
  UserRoleResponse,
  UserRoleUpdateRequest,
  UserSuspendRequest,
  UserUpsertRequest,
} from '@/models/user-management.model';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private static readonly SKIP_LOADING_HEADER = new HttpHeaders({ 'X-Loading-Mode': 'skip' });
  private static readonly PAGE_LOADING_HEADER = new HttpHeaders({ 'X-Loading-Mode': 'page' });

  private readonly http = inject(HttpClient);
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  filterUsers(
    request: UserFilterRequest,
    page: number,
    size: number,
    skipLoading = false,
  ): Observable<ResponseApi<UserPageResponse<UserListItem>>> {
    return this.http.post<ResponseApi<UserPageResponse<UserListItem>>>(
      `${buildApiUrl(API_ENDPOINTS.users.search)}?page=${page}&size=${size}`,
      request,
      {
        context: this.noGlobalToastCtx,
        headers: skipLoading
          ? UserManagementService.SKIP_LOADING_HEADER
          : UserManagementService.PAGE_LOADING_HEADER,
      },
    );
  }

  getUserById(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.http.get<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.byId(userId)), { context: this.noGlobalToastCtx });
  }

  getMetaOptions(): Observable<ResponseApi<{ roles: string[]; positions: string[]; departments: string[] }>> {
    return this.http.get<ResponseApi<{ roles: string[]; positions: string[]; departments: string[] }>>(
      buildApiUrl(API_ENDPOINTS.users.meta), { context: this.noGlobalToastCtx },
    );
  }

  // --- Lifecycle Actions ---

  approveUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.approve(userId)), {}, { context: this.noGlobalToastCtx });
  }

  rejectUser(userId: UserId, request: UserRejectRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.reject(userId)), request, { context: this.noGlobalToastCtx });
  }

  suspendUser(userId: UserId, request: UserSuspendRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.suspend(userId)), request, { context: this.noGlobalToastCtx });
  }

  reactivateUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.reactivate(userId)), {}, { context: this.noGlobalToastCtx });
  }

  // --- Login Access ---

  lockUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.lock(userId)), {}, { context: this.noGlobalToastCtx });
  }

  unlockUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.unlock(userId)), {}, { context: this.noGlobalToastCtx });
  }

  resetPassword(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.http.post<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.resetPassword(userId)), {}, { context: this.noGlobalToastCtx });
  }

  resendActivationEmail(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.http.post<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.resendActivation(userId)), {}, { context: this.noGlobalToastCtx });
  }

  // --- Profile ---

  updateProfile(userId: UserId, request: UserProfileUpdateRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.patch<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.profile(userId)), request, { context: this.noGlobalToastCtx });
  }

  assignMentor(userId: UserId, mentorId: number): Observable<ResponseApi<{ userId: UserId; mentorId: number }>> {
    return this.http.patch<ResponseApi<{ userId: UserId; mentorId: number }>>(
      buildApiUrl(API_ENDPOINTS.users.mentor(userId, mentorId)), {}, { context: this.noGlobalToastCtx },
    );
  }

  // --- Role Management ---

  getUserRoles(userId: UserId): Observable<ResponseApi<UserRoleResponse>> {
    return this.http.get<ResponseApi<UserRoleResponse>>(buildApiUrl(API_ENDPOINTS.users.role(userId)), { context: this.noGlobalToastCtx });
  }

  assignRoleById(userId: UserId, request: AssignRoleRequest): Observable<ResponseApi<UserRoleResponse>> {
    return this.http.put<ResponseApi<UserRoleResponse>>(buildApiUrl(API_ENDPOINTS.users.role(userId)), request, { context: this.noGlobalToastCtx });
  }

  detachRole(userId: UserId, request: DetachRoleRequest): Observable<ResponseApi<UserRoleResponse>> {
    return this.http.delete<ResponseApi<UserRoleResponse>>(buildApiUrl(API_ENDPOINTS.users.role(userId)), {
      body: request, context: this.noGlobalToastCtx,
    });
  }

  // --- Authz ---

  getAuthzRoles(): Observable<ResponseApi<AuthzRole[]>> {
    return this.http.get<ResponseApi<AuthzRole[]>>(buildApiUrl(API_ENDPOINTS.authz.roles), { context: this.noGlobalToastCtx });
  }

  // --- Legacy methods (kept for compatibility) ---

  createUser(request: UserUpsertRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.post<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.root), request, { context: this.noGlobalToastCtx });
  }

  updateUser(userId: UserId, request: UserUpsertRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.byId(userId)), request, { context: this.noGlobalToastCtx });
  }

  activateUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.activate(userId)), {}, { context: this.noGlobalToastCtx });
  }

  deactivateUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.deactivate(userId)), {}, { context: this.noGlobalToastCtx });
  }

  deleteUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.http.delete<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.byId(userId)), { context: this.noGlobalToastCtx });
  }

  restoreUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.restore(userId)), {}, { context: this.noGlobalToastCtx });
  }

  assignRole(userId: UserId, request: UserRoleUpdateRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.role(userId)), request, { context: this.noGlobalToastCtx });
  }

  updateOrganization(userId: UserId, request: UserOrganizationUpdateRequest): Observable<ResponseApi<UserDetail>> {
    return this.http.put<ResponseApi<UserDetail>>(buildApiUrl(API_ENDPOINTS.users.organization(userId)), request, { context: this.noGlobalToastCtx });
  }

  getActivityHistory(userId: UserId): Observable<ResponseApi<UserHistoryRecord[]>> {
    return this.http.get<ResponseApi<UserHistoryRecord[]>>(buildApiUrl(API_ENDPOINTS.users.activityHistory(userId)), { context: this.noGlobalToastCtx });
  }

  getLoginHistory(userId: UserId): Observable<ResponseApi<UserHistoryRecord[]>> {
    return this.http.get<ResponseApi<UserHistoryRecord[]>>(buildApiUrl(API_ENDPOINTS.users.loginHistory(userId)), { context: this.noGlobalToastCtx });
  }
}
