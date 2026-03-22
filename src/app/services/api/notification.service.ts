import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { NotificationRecord } from '@/models/notification.model';
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiClient = inject(ApiClientService);

  /**
   * Fetch all notifications
   */
  getNotifications(): Observable<ResponseApi<NotificationRecord[]>> {
    return this.apiClient.get<ResponseApi<NotificationRecord[]>>(API_ENDPOINTS.notifications.root, { skipErrorToast: true });
  }

  /**
   * Get a single notification by ID
   */
  getNotificationById(id: number): Observable<ResponseApi<NotificationRecord>> {
    return this.apiClient.get<ResponseApi<NotificationRecord>>(API_ENDPOINTS.notifications.byId(id), { skipErrorToast: true });
  }

  /**
   * Create a new notification
   */
  createNotification(data: Partial<NotificationRecord>): Observable<ResponseApi<NotificationRecord>> {
    return this.apiClient.post<ResponseApi<NotificationRecord>>(API_ENDPOINTS.notifications.root, data, { skipErrorToast: true });
  }

  /**
   * Update an existing notification
   */
  updateNotification(id: number, data: Partial<NotificationRecord>): Observable<ResponseApi<void>> {
    return this.apiClient.put<ResponseApi<void>>(API_ENDPOINTS.notifications.byId(id), data, { skipErrorToast: true });
  }

  /**
   * Delete a notification
   */
  deleteNotification(id: number): Observable<ResponseApi<void>> {
    return this.apiClient.delete<ResponseApi<void>>(API_ENDPOINTS.notifications.byId(id), { skipErrorToast: true });
  }

  /**
   * Send a notification now
   */
  sendNow(id: number): Observable<ResponseApi<void>> {
    return this.apiClient.post<ResponseApi<void>>(API_ENDPOINTS.notifications.sendNow(id), {}, { skipErrorToast: true });
  }
}
