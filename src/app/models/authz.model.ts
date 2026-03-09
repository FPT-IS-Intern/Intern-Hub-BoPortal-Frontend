export interface AuthzRole {
  id: number;
  name: string;
  description: string;
  status: string;
}

export interface AuthzResource {
  id: number;
  name: string;
  code: string;
  description: string;
  categoryId: number;
}

export interface ResourcePermission {
  id: number;
  permissions: number[];
}

export interface UpdateRolePermissionsRequest {
  resources: ResourcePermission[];
}
