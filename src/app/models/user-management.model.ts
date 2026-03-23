export type UserId = string;
export type UserLifecycleStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type UserSystemStatus = UserLifecycleStatus | 'ACTIVE' | 'INACTIVE';
export type UserLoginStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserFilterRequest {
  keyword?: string;
  sysStatuses?: UserSystemStatus[];
  roles?: string[];
  positions?: string[];
  departments?: string[];
}

export interface UserListItem {
  no?: number;
  userId: UserId;
  avatarUrl?: string;
  fullName?: string;
  sysStatus?: UserSystemStatus;
  email?: string;
  role?: string;
  position?: string;
  department?: string;
  deleted?: boolean;
}

export interface UserDetail {
  userId: UserId;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  positionCode?: string;
  role?: string;
  status?: UserLifecycleStatus;
  loginStatus?: UserLoginStatus;
  department?: string;
  activated?: boolean;
  deleted?: boolean;
}

export interface UserPageResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
}

export interface UserMetaOptionsResponse {
  roles: string[];
  positions: string[];
  departments: string[];
}

export interface UserUpsertRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  position: string;
  department: string;
}

export interface UserRoleUpdateRequest {
  role: string;
}

export interface UserOrganizationUpdateRequest {
  position: string;
  department: string;
}

export interface UserHistoryRecord {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  actor?: string;
}

export interface UserProfileUpdateRequest {
  fullName?: string;
  phoneNumber?: string;
  positionCode?: string;
  department?: string;
}

export interface UserRejectRequest {
  reason: string;
}

export interface UserSuspendRequest {
  reason: string;
}

export interface AuthzRole {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface UserRoleResponse {
  userId: UserId;
  roles: AuthzRole[];
}

export type UserSummary = UserListItem | UserDetail;

export interface AssignRoleRequest {
  roleId: string;
}

export interface DetachRoleRequest {
  roleId: string;
}
