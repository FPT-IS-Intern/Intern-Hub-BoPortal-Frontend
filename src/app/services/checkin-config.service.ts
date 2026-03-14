import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getBaseUrl } from '../core/config/app-config';
import { CheckinConfigResponse, IPRange, AttendanceLocation } from '../models/checkin-config.model';
import { SKIP_API_ERROR_TOAST } from '../core/interceptors/api-error.interceptor';

@Injectable({
  providedIn: 'root'
})
export class CheckinConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${getBaseUrl()}/bo-portal`;
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  /**
   * Fetch all branches with their nested check-in configurations
   */
  getCheckinConfigs(): Observable<CheckinConfigResponse> {
    return this.http.get<CheckinConfigResponse>(`${this.baseUrl}/branches/with-checkin-rules`, { context: this.noGlobalToastCtx });
  }

  // --- Branches CRUD ---
  getBranches(): Observable<any> {
    return this.http.get(`${this.baseUrl}/branches`, { context: this.noGlobalToastCtx });
  }

  getBranchById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/branches/${id}`, { context: this.noGlobalToastCtx });
  }

  createBranch(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/branches`, data, { context: this.noGlobalToastCtx });
  }

  updateBranch(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/branches/${id}`, data, { context: this.noGlobalToastCtx });
  }

  deleteBranch(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/branches/${id}`, { context: this.noGlobalToastCtx });
  }

  // --- IP Ranges ---
  createIPRange(data: Partial<IPRange>): Observable<any> {
    return this.http.post(`${this.baseUrl}/allowed-ip-ranges`, data, { context: this.noGlobalToastCtx });
  }

  updateIPRange(id: string, data: Partial<IPRange>): Observable<any> {
    return this.http.put(`${this.baseUrl}/allowed-ip-ranges/${id}`, data, { context: this.noGlobalToastCtx });
  }

  deleteIPRange(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/allowed-ip-ranges/${id}`, { context: this.noGlobalToastCtx });
  }

  // --- Attendance Locations ---
  createLocation(data: Partial<AttendanceLocation>): Observable<any> {
    return this.http.post(`${this.baseUrl}/attendance-locations`, data, { context: this.noGlobalToastCtx });
  }

  updateLocation(id: string, data: Partial<AttendanceLocation>): Observable<any> {
    return this.http.put(`${this.baseUrl}/attendance-locations/${id}`, data, { context: this.noGlobalToastCtx });
  }

  deleteLocation(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/attendance-locations/${id}`, { context: this.noGlobalToastCtx });
  }
}
