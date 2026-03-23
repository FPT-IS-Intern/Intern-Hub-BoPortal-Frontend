import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { AttendanceLocation, BranchCheckinConfig, CheckinConfigResponse, IPRange } from '@/models/checkin-config.model';
import { ApiClientService } from '@/services/api/api-client.service';

type BranchPayload = Pick<BranchCheckinConfig, 'name' | 'description' | 'isActive'> & Partial<Pick<BranchCheckinConfig, 'id'>>;

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
  getBranches(): Observable<BranchCheckinConfig[]> {
    return this.apiClient.get<BranchCheckinConfig[]>(API_ENDPOINTS.branches.root, { skipErrorToast: true });
  }

  getBranchById(id: string): Observable<BranchCheckinConfig> {
    return this.apiClient.get<BranchCheckinConfig>(API_ENDPOINTS.branches.byId(id), { skipErrorToast: true });
  }

  createBranch(data: BranchPayload): Observable<BranchCheckinConfig> {
    return this.apiClient.post<BranchCheckinConfig>(API_ENDPOINTS.branches.root, data, { skipErrorToast: true });
  }

  updateBranch(id: string, data: BranchPayload): Observable<BranchCheckinConfig> {
    return this.apiClient.put<BranchCheckinConfig>(API_ENDPOINTS.branches.byId(id), data, { skipErrorToast: true });
  }

  deleteBranch(id: string): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.branches.byId(id), { skipErrorToast: true });
  }

  // --- IP Ranges ---
  createIPRange(data: Partial<IPRange>): Observable<IPRange> {
    return this.apiClient.post<IPRange>(API_ENDPOINTS.allowedIpRanges.root, data, { skipErrorToast: true });
  }

  updateIPRange(id: string, data: Partial<IPRange>): Observable<IPRange> {
    return this.apiClient.put<IPRange>(API_ENDPOINTS.allowedIpRanges.byId(id), data, { skipErrorToast: true });
  }

  deleteIPRange(id: string): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.allowedIpRanges.byId(id), { skipErrorToast: true });
  }

  // --- Attendance Locations ---
  createLocation(data: Partial<AttendanceLocation>): Observable<AttendanceLocation> {
    return this.apiClient.post<AttendanceLocation>(API_ENDPOINTS.attendanceLocations.root, data, { skipErrorToast: true });
  }

  updateLocation(id: string, data: Partial<AttendanceLocation>): Observable<AttendanceLocation> {
    return this.apiClient.put<AttendanceLocation>(API_ENDPOINTS.attendanceLocations.byId(id), data, { skipErrorToast: true });
  }

  deleteLocation(id: string): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.attendanceLocations.byId(id), { skipErrorToast: true });
  }
}
