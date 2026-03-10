export interface AuthzRole {
  id: string;
  name: string;
  description: string;
  status: string;
}

export interface AuthzResource {
  id: string;
  name: string;
  code: string;
  description: string;
  categoryId: string;
}

export interface ResourcePermission {
  id: string;
  permissions: number[];
}

export interface UpdateRolePermissionsRequest {
  resources: ResourcePermission[];
}

export interface AuthzRolePermission {
  resource: { id: string };
  permissions: string[];
}
