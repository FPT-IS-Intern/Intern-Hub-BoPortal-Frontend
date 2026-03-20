export interface UserFilterRequest {
  keyword?: string;
  sysStatuses?: string[];
  roles?: string[];
  positions?: string[];
  departments?: string[];
}

export interface UserListItem {
  no?: number;
  userId: number;
  avatarUrl?: string;
  fullName?: string;
  sysStatus?: string;
  email?: string;
  role?: string;
  position?: string;
  department?: string;
  deleted?: boolean;
}

export interface UserDetail {
  userId: number;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  positionCode?: string;
  role?: string;
  status?: string;
  loginStatus?: string;
  department?: string;
  activated?: boolean;
  deleted?: boolean;
}

export interface UserPageResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
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
  userId: number;
  roles: AuthzRole[];
}

export interface AssignRoleRequest {
  roleId: string;
}

export interface DetachRoleRequest {
  roleId: string;
}
