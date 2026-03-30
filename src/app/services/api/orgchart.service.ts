import { inject, Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import {
  OrgChartPageResponse,
  OrgChartUserUpsertRequest,
  OrgChartUserDetail,
  OrgChartUserLite,
  OrgChartUserNode,
} from '@/models/orgchart.model';
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({
  providedIn: 'root',
})
export class OrgChartService {
  private static readonly SKIP_LOADING_HEADER = new HttpHeaders({ 'X-Loading-Mode': 'skip' });
  private readonly apiClient = inject(ApiClientService);

  getTree(rootId?: string | number | null, maxDepth = 2): Observable<ResponseApi<OrgChartUserNode>> {
    return this.apiClient.get<ResponseApi<OrgChartUserNode>>(API_ENDPOINTS.orgChart.root, {
      params: {
        ...(rootId != null ? { rootId } : {}),
        maxDepth,
      },
      skipErrorToast: true,
    });
  }

  getSubordinates(
    userId: string | number,
    page = 1,
    limit = 50,
  ): Observable<ResponseApi<OrgChartPageResponse<OrgChartUserNode>>> {
    return this.apiClient.get<ResponseApi<OrgChartPageResponse<OrgChartUserNode>>>(
      API_ENDPOINTS.orgChart.subordinates(userId),
      {
        headers: OrgChartService.SKIP_LOADING_HEADER,
        params: { page, limit },
        skipErrorToast: true,
      },
    );
  }

  getUserDetail(userId: string | number): Observable<ResponseApi<OrgChartUserDetail>> {
    return this.apiClient.get<ResponseApi<OrgChartUserDetail>>(API_ENDPOINTS.orgChart.byId(userId), {
      skipErrorToast: true,
    });
  }

  createUser(request: OrgChartUserUpsertRequest): Observable<ResponseApi<OrgChartUserDetail>> {
    return this.apiClient.post<ResponseApi<OrgChartUserDetail>>(API_ENDPOINTS.orgChart.create, request, {
      skipErrorToast: true,
    });
  }

  updateUser(userId: string | number, request: OrgChartUserUpsertRequest): Observable<ResponseApi<OrgChartUserDetail>> {
    return this.apiClient.patch<ResponseApi<OrgChartUserDetail>>(API_ENDPOINTS.orgChart.update(userId), request, {
      skipErrorToast: true,
    });
  }

  updateManager(userId: string | number, managerId?: string | number | null): Observable<ResponseApi<OrgChartUserDetail>> {
    return this.apiClient.put<ResponseApi<OrgChartUserDetail>>(API_ENDPOINTS.orgChart.manager(userId), {}, {
      params: managerId == null ? {} : { managerId },
      skipErrorToast: true,
    });
  }

  deleteUser(userId: string | number): Observable<ResponseApi<OrgChartUserDetail>> {
    return this.apiClient.delete<ResponseApi<OrgChartUserDetail>>(API_ENDPOINTS.orgChart.delete(userId), {
      skipErrorToast: true,
    });
  }

  searchUsers(
    query?: string,
    department?: string,
    status?: string,
    page = 1,
    limit = 20,
  ): Observable<ResponseApi<OrgChartPageResponse<OrgChartUserNode>>> {
    return this.apiClient.get<ResponseApi<OrgChartPageResponse<OrgChartUserNode>>>(
      API_ENDPOINTS.orgChart.search,
      {
        headers: OrgChartService.SKIP_LOADING_HEADER,
        params: {
          ...(query ? { q: query } : {}),
          ...(department ? { department } : {}),
          ...(status ? { status } : {}),
          page,
          limit,
        },
        skipErrorToast: true,
      },
    );
  }

  getPath(userId: string | number): Observable<ResponseApi<{ data: OrgChartUserLite[] }>> {
    return this.apiClient.get<ResponseApi<{ data: OrgChartUserLite[] }>>(API_ENDPOINTS.orgChart.path(userId), {
      headers: OrgChartService.SKIP_LOADING_HEADER,
      skipErrorToast: true,
    });
  }
}
