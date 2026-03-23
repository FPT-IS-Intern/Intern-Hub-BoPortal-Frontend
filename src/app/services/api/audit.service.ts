import { inject, Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { ApiClientService } from '@/services/api/api-client.service';
import {
  ActionFunctionRequest,
  ActionFunctionResponse,
  AuditHashCheckResponse,
  AuditPageResponse,
  AuditQueryRequest,
} from '@/models/audit-log.model';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private static readonly LOADING_HEADER = new HttpHeaders({ 'X-Loading-Mode': 'page' });
  private readonly apiClient = inject(ApiClientService);

  queryAudits(
    request: AuditQueryRequest,
  ): Observable<ResponseApi<AuditPageResponse>> {
    // Need to convert request to HttpParams, so we pass it in the params object.
    return this.apiClient.get<ResponseApi<AuditPageResponse>>(
      API_ENDPOINTS.audit.root,
      {
        headers: AuditService.LOADING_HEADER,
        params: { ...request },
      },
    );
  }

  verifyHash(auditId: number | string): Observable<ResponseApi<AuditHashCheckResponse>> {
    return this.apiClient.get<ResponseApi<AuditHashCheckResponse>>(
      API_ENDPOINTS.audit.verifyHash(auditId),
      {
        skipErrorToast: false,
      },
    );
  }

  getActionFunctions(): Observable<ResponseApi<ActionFunctionResponse[]>> {
    return this.apiClient.get<ResponseApi<ActionFunctionResponse[]>>(
      API_ENDPOINTS.audit.actionFunctions,
      {
        headers: AuditService.LOADING_HEADER,
      },
    );
  }

  createActionFunction(request: ActionFunctionRequest): Observable<ResponseApi<ActionFunctionResponse>> {
    return this.apiClient.post<ResponseApi<ActionFunctionResponse>>(
      API_ENDPOINTS.audit.actionFunctions,
      request,
      {
        headers: AuditService.LOADING_HEADER,
      },
    );
  }
}
