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

  // CRUD for IP Ranges
  upsertIPRange(branchId: string, range: Partial<IPRange>): Observable<any> {
    return this.http.post(`${this.baseUrl}/allowed-ip-ranges`, { ...range, branchId });
  }

  deleteIPRange(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/allowed-ip-ranges/${id}`);
  }

  // CRUD for Locations
  upsertLocation(branchId: string, location: Partial<AttendanceLocation>): Observable<any> {
    return this.http.post(`${this.baseUrl}/attendance-locations`, { ...location, branchId });
  }

  deleteLocation(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/attendance-locations/${id}`);
  }
}
