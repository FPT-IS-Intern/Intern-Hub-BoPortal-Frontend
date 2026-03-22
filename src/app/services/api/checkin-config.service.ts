import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../../core/config/app-config';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { CheckinConfigResponse, IPRange, AttendanceLocation } from '../../models/checkin-config.model';
import { SKIP_API_ERROR_TOAST } from '../../core/interceptors/api-error.interceptor';

@Injectable({
  providedIn: 'root'
})
export class CheckinConfigService {
  private readonly http = inject(HttpClient);
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  /**
   * Fetch all branches with their nested check-in configurations
   */
  getCheckinConfigs(): Observable<CheckinConfigResponse> {
    return this.http.get<CheckinConfigResponse>(buildApiUrl(API_ENDPOINTS.branches.withCheckinRules), { context: this.noGlobalToastCtx });
  }

  // --- Branches CRUD ---
  getBranches(): Observable<any> {
    return this.http.get(buildApiUrl(API_ENDPOINTS.branches.root), { context: this.noGlobalToastCtx });
  }

  getBranchById(id: string): Observable<any> {
    return this.http.get(buildApiUrl(API_ENDPOINTS.branches.byId(id)), { context: this.noGlobalToastCtx });
  }

  createBranch(data: any): Observable<any> {
    return this.http.post(buildApiUrl(API_ENDPOINTS.branches.root), data, { context: this.noGlobalToastCtx });
  }

  updateBranch(id: string, data: any): Observable<any> {
    return this.http.put(buildApiUrl(API_ENDPOINTS.branches.byId(id)), data, { context: this.noGlobalToastCtx });
  }

  deleteBranch(id: string): Observable<any> {
    return this.http.delete(buildApiUrl(API_ENDPOINTS.branches.byId(id)), { context: this.noGlobalToastCtx });
  }

  // --- IP Ranges ---
  createIPRange(data: Partial<IPRange>): Observable<any> {
    return this.http.post(buildApiUrl(API_ENDPOINTS.allowedIpRanges.root), data, { context: this.noGlobalToastCtx });
  }

  updateIPRange(id: string, data: Partial<IPRange>): Observable<any> {
    return this.http.put(buildApiUrl(API_ENDPOINTS.allowedIpRanges.byId(id)), data, { context: this.noGlobalToastCtx });
  }

  deleteIPRange(id: string): Observable<any> {
    return this.http.delete(buildApiUrl(API_ENDPOINTS.allowedIpRanges.byId(id)), { context: this.noGlobalToastCtx });
  }

  // --- Attendance Locations ---
  createLocation(data: Partial<AttendanceLocation>): Observable<any> {
    return this.http.post(buildApiUrl(API_ENDPOINTS.attendanceLocations.root), data, { context: this.noGlobalToastCtx });
  }

  updateLocation(id: string, data: Partial<AttendanceLocation>): Observable<any> {
    return this.http.put(buildApiUrl(API_ENDPOINTS.attendanceLocations.byId(id)), data, { context: this.noGlobalToastCtx });
  }

  deleteLocation(id: string): Observable<any> {
    return this.http.delete(buildApiUrl(API_ENDPOINTS.attendanceLocations.byId(id)), { context: this.noGlobalToastCtx });
  }
}
