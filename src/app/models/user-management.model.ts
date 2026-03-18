export interface UserFilterRequest {
  keyword?: string;
  sysStatuses?: string[];
  roles?: string[];
  positions?: string[];
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
}

export interface UserDetail {
  userId: number;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  positionCode?: string;
  role?: string;
  status?: string;
}

export interface UserPageResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
}
