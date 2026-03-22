import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { CheckinConfigResponse, IPRange, AttendanceLocation } from '@/models/checkin-config.model';
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({
  providedIn: 'root'
})
export class CheckinConfigService {
  constructor(private readonly apiClient: ApiClientService) {}

  /**
   * Fetch all branches with their nested check-in configurations
   */
  getCheckinConfigs(): Observable<CheckinConfigResponse> {
    return this.apiClient.get<CheckinConfigResponse>(API_ENDPOINTS.branches.withCheckinRules, { skipErrorToast: true });
  }

  // --- Branches CRUD ---
  getBranches(): Observable<any> {
    return this.apiClient.get(API_ENDPOINTS.branches.root, { skipErrorToast: true });
  }

  getBranchById(id: string): Observable<any> {
    return this.apiClient.get(API_ENDPOINTS.branches.byId(id), { skipErrorToast: true });
  }

  createBranch(data: any): Observable<any> {
    return this.apiClient.post(API_ENDPOINTS.branches.root, data, { skipErrorToast: true });
  }

  updateBranch(id: string, data: any): Observable<any> {
    return this.apiClient.put(API_ENDPOINTS.branches.byId(id), data, { skipErrorToast: true });
  }

  deleteBranch(id: string): Observable<any> {
    return this.apiClient.delete(API_ENDPOINTS.branches.byId(id), { skipErrorToast: true });
  }

  // --- IP Ranges ---
  createIPRange(data: Partial<IPRange>): Observable<any> {
    return this.apiClient.post(API_ENDPOINTS.allowedIpRanges.root, data, { skipErrorToast: true });
  }

  updateIPRange(id: string, data: Partial<IPRange>): Observable<any> {
    return this.apiClient.put(API_ENDPOINTS.allowedIpRanges.byId(id), data, { skipErrorToast: true });
  }

  deleteIPRange(id: string): Observable<any> {
    return this.apiClient.delete(API_ENDPOINTS.allowedIpRanges.byId(id), { skipErrorToast: true });
  }

  // --- Attendance Locations ---
  createLocation(data: Partial<AttendanceLocation>): Observable<any> {
    return this.apiClient.post(API_ENDPOINTS.attendanceLocations.root, data, { skipErrorToast: true });
  }

  updateLocation(id: string, data: Partial<AttendanceLocation>): Observable<any> {
    return this.apiClient.put(API_ENDPOINTS.attendanceLocations.byId(id), data, { skipErrorToast: true });
  }

  deleteLocation(id: string): Observable<any> {
    return this.apiClient.delete(API_ENDPOINTS.attendanceLocations.byId(id), { skipErrorToast: true });
  }
}
