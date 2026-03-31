export type OrgChartStatus = 'active' | 'intern' | 'inactive';

export interface OrgChartUserLite {
  id: string;
  name: string;
  title?: string;
  avatar?: string | null;
}

export interface OrgChartDepartment {
  id?: string | null;
  name?: string | null;
  code?: string | null;
}

export interface OrgChartUserNode {
  id: string;
  name: string;
  title?: string | null;
  department?: string | null;
  avatar?: string | null;
  email?: string | null;
  phone?: string | null;
  status: OrgChartStatus;
  joinedDate?: string | null;
  location?: string | null;
  managerId?: string | null;
  hasChildren: boolean;
  subordinateCount: number;
  children: OrgChartUserNode[];
}

export interface OrgChartUserDetail {
  id: string;
  name: string;
  title?: string | null;
  department?: OrgChartDepartment | null;
  avatar?: string | null;
  email?: string | null;
  phone?: string | null;
  status: OrgChartStatus;
  joinedDate?: string | null;
  location?: string | null;
  manager?: OrgChartUserLite | null;
  subordinates: OrgChartUserLite[];
  projects: string[];
  hasChildren: boolean;
  subordinateCount: number;
}

export interface OrgChartUserUpsertRequest {
  fullName: string;
  companyEmail: string;
  phoneNumber?: string | null;
  address: string;
  positionCode: string;
  status: OrgChartStatus;
  managerId?: number | null;
}

export interface OrgChartBulkManagerUpdateRequest {
  userIds: Array<string | number>;
  managerId?: string | number | null;
}

export interface OrgChartInitializeRootRequest {
  userId: string | number;
}

export interface OrgChartBulkManagerUpdateResponse {
  updatedUserIds: string[];
  managerId?: string | null;
  updatedCount: number;
}

export interface OrgChartMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrgChartPageResponse<T> {
  data: T[];
  meta: OrgChartMeta;
}
