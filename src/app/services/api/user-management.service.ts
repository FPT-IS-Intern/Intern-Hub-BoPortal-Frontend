import { inject, Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
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
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private static readonly SKIP_LOADING_HEADER = new HttpHeaders({ 'X-Loading-Mode': 'skip' });
  private static readonly PAGE_LOADING_HEADER = new HttpHeaders({ 'X-Loading-Mode': 'page' });

  private readonly apiClient = inject(ApiClientService);

  filterUsers(
    request: UserFilterRequest,
    page: number,
    size: number,
    skipLoading = false,
  ): Observable<ResponseApi<UserPageResponse<UserListItem>>> {
    return this.apiClient.post<ResponseApi<UserPageResponse<UserListItem>>>(
      API_ENDPOINTS.users.search,
      request,
      {
        headers: skipLoading
          ? UserManagementService.SKIP_LOADING_HEADER
          : UserManagementService.PAGE_LOADING_HEADER,
        params: { page, size },
        skipErrorToast: true,
      },
    );
  }

  getUserById(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.get<ResponseApi<UserDetail>>(API_ENDPOINTS.users.byId(userId), { skipErrorToast: true });
  }

  getMetaOptions(): Observable<ResponseApi<{ roles: string[]; positions: string[]; departments: string[] }>> {
    return this.apiClient.get<ResponseApi<{ roles: string[]; positions: string[]; departments: string[] }>>(
      API_ENDPOINTS.users.meta, { skipErrorToast: true },
    );
  }

  // --- Lifecycle Actions ---

  approveUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.approve(userId), {}, { skipErrorToast: true });
  }

  rejectUser(userId: UserId, request: UserRejectRequest): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.reject(userId), request, { skipErrorToast: true });
  }

  suspendUser(userId: UserId, request: UserSuspendRequest): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.suspend(userId), request, { skipErrorToast: true });
  }

  reactivateUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.reactivate(userId), {}, { skipErrorToast: true });
  }

  // --- Login Access ---

  lockUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.lock(userId), {}, { skipErrorToast: true });
  }

  unlockUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.unlock(userId), {}, { skipErrorToast: true });
  }

  resetPassword(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.post<ResponseApi<UserDetail>>(API_ENDPOINTS.users.resetPassword(userId), {}, { skipErrorToast: true });
  }

  resendActivationEmail(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.post<ResponseApi<UserDetail>>(API_ENDPOINTS.users.resendActivation(userId), {}, { skipErrorToast: true });
  }

  // --- Profile ---

  updateProfile(userId: UserId, request: UserProfileUpdateRequest): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.patch<ResponseApi<UserDetail>>(API_ENDPOINTS.users.profile(userId), request, { skipErrorToast: true });
  }

  assignMentor(userId: UserId, mentorId: number): Observable<ResponseApi<{ userId: UserId; mentorId: number }>> {
    return this.apiClient.patch<ResponseApi<{ userId: UserId; mentorId: number }>>(
      API_ENDPOINTS.users.mentor(userId, mentorId), {}, { skipErrorToast: true },
    );
  }

  // --- Role Management ---

  getUserRoles(userId: UserId): Observable<ResponseApi<UserRoleResponse>> {
    return this.apiClient.get<ResponseApi<UserRoleResponse>>(API_ENDPOINTS.users.role(userId), { skipErrorToast: true });
  }

  assignRoleById(userId: UserId, request: AssignRoleRequest): Observable<ResponseApi<UserRoleResponse>> {
    return this.apiClient.put<ResponseApi<UserRoleResponse>>(API_ENDPOINTS.users.role(userId), request, { skipErrorToast: true });
  }

  detachRole(userId: UserId, request: DetachRoleRequest): Observable<ResponseApi<UserRoleResponse>> {
    return this.apiClient.delete<ResponseApi<UserRoleResponse>>(API_ENDPOINTS.users.role(userId), {
      body: request,
      skipErrorToast: true,
    });
  }

  // --- Authz ---

  getAuthzRoles(): Observable<ResponseApi<AuthzRole[]>> {
    return this.apiClient.get<ResponseApi<AuthzRole[]>>(API_ENDPOINTS.authz.roles, { skipErrorToast: true });
  }

  // --- Legacy methods (kept for compatibility) ---

  createUser(request: UserUpsertRequest): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.post<ResponseApi<UserDetail>>(API_ENDPOINTS.users.root, request, { skipErrorToast: true });
  }

  updateUser(userId: UserId, request: UserUpsertRequest): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.byId(userId), request, { skipErrorToast: true });
  }

  activateUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.activate(userId), {}, { skipErrorToast: true });
  }

  deactivateUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.deactivate(userId), {}, { skipErrorToast: true });
  }

  deleteUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.delete<ResponseApi<UserDetail>>(API_ENDPOINTS.users.byId(userId), { skipErrorToast: true });
  }

  restoreUser(userId: UserId): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.restore(userId), {}, { skipErrorToast: true });
  }

  assignRole(userId: UserId, request: UserRoleUpdateRequest): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.role(userId), request, { skipErrorToast: true });
  }

  updateOrganization(userId: UserId, request: UserOrganizationUpdateRequest): Observable<ResponseApi<UserDetail>> {
    return this.apiClient.put<ResponseApi<UserDetail>>(API_ENDPOINTS.users.organization(userId), request, { skipErrorToast: true });
  }

  getActivityHistory(userId: UserId): Observable<ResponseApi<UserHistoryRecord[]>> {
    return this.apiClient.get<ResponseApi<UserHistoryRecord[]>>(API_ENDPOINTS.users.activityHistory(userId), { skipErrorToast: true });
  }

  getLoginHistory(userId: UserId): Observable<ResponseApi<UserHistoryRecord[]>> {
    return this.apiClient.get<ResponseApi<UserHistoryRecord[]>>(API_ENDPOINTS.users.loginHistory(userId), { skipErrorToast: true });
  }
}
