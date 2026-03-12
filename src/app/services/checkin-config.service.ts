import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CheckinConfigResponse, IPRange, AttendanceLocation } from '../models/checkin-config.model';

@Injectable({
  providedIn: 'root'
})
export class CheckinConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/bo-portal`;

  /**
   * Fetch all branches with their nested check-in configurations
   */
  getCheckinConfigs(): Observable<CheckinConfigResponse> {
    // The user provided two specific endpoints but also a combined data structure.
    // Based on the user's latest data structure, it seems they want a grouped view.
    // I'll assume there's an endpoint that returns this nested structure or I'll implement 
    // it to fetch from multiple if needed. For now, following the specific grouped data provided.
    return this.http.get<CheckinConfigResponse>(`${this.baseUrl}/checkin-configs`);
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
