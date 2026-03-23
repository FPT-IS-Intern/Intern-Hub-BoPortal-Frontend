export interface AuditQueryRequest {
  startDate?: string;
  endDate?: string;
  day?: string;
  action?: string;
  actorIds?: string[];
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface AuditItemResponse {
  id: number;
  entity: string;
  actor: string;
  actorId: number;
  action: string;
  actionDescription: string;
  actionStatus: string;
  oldValue: string;
  newValue: string;
  requestId: string;
  traceId: string;
  ipAddress: string;
  timeStamp: string;
  hash: string;
}

export interface AuditPageResponse {
  content: AuditItemResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuditHashCheckResponse {
  auditId: number;
  valid: boolean;
}

export interface ActionFunctionRequest {
  action: string;
  description: string;
}

export interface ActionFunctionResponse {
  id: number;
  action: string;
  description: string;
}
