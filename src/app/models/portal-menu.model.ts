export interface PortalMenuItem {
  id: number;
  code: string;
  title: string;
  path?: string;
  icon?: string;
  parentId?: number | null;
  roleCodes?: string[];
  sortOrder?: number;
  status?: string;
  children?: PortalMenuItem[];
}

export interface PortalMenuRequest {
  code: string;
  title: string;
  path?: string;
  icon?: string;
  parentId?: number | null;
  roleCodes?: string[];
  sortOrder?: number;
  status?: string;
}
