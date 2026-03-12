import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getBaseUrl } from '../core/config/app-config';
import { CheckinConfigResponse, IPRange, AttendanceLocation } from '../models/checkin-config.model';

@Injectable({
  providedIn: 'root'
})
export class CheckinConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${getBaseUrl()}/bo-portal`;

  /**
   * Fetch all branches with their nested check-in configurations
   */
  getCheckinConfigs(): Observable<CheckinConfigResponse> {
    return this.http.get<CheckinConfigResponse>(`${this.baseUrl}/branches/with-checkin-rules`);
  }

  // --- Branches CRUD ---
  getBranches(): Observable<any> {
    return this.http.get(`${this.baseUrl}/branches`);
  }

  getBranchById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/branches/${id}`);
  }

  createBranch(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/branches`, data);
  }

  updateBranch(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/branches/${id}`, data);
  }

  deleteBranch(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/branches/${id}`);
  }

  // --- IP Ranges ---
  createIPRange(data: Partial<IPRange>): Observable<any> {
    return this.http.post(`${this.baseUrl}/allowed-ip-ranges`, data);
  }

  updateIPRange(id: string, data: Partial<IPRange>): Observable<any> {
    return this.http.put(`${this.baseUrl}/allowed-ip-ranges/${id}`, data);
  }

  deleteIPRange(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/allowed-ip-ranges/${id}`);
  }

  // --- Attendance Locations ---
  createLocation(data: Partial<AttendanceLocation>): Observable<any> {
    return this.http.post(`${this.baseUrl}/attendance-locations`, data);
  }

  updateLocation(id: string, data: Partial<AttendanceLocation>): Observable<any> {
    return this.http.put(`${this.baseUrl}/attendance-locations/${id}`, data);
  }

  deleteLocation(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/attendance-locations/${id}`);
  }
}
