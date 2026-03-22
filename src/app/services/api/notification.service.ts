import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../../core/config/app-config';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { NotificationRecord } from '../../models/notification.model';
import { SKIP_API_ERROR_TOAST } from '../../core/interceptors/api-error.interceptor';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  /**
   * Fetch all notifications
   */
  getNotifications(): Observable<ResponseApi<NotificationRecord[]>> {
    return this.http.get<ResponseApi<NotificationRecord[]>>(buildApiUrl(API_ENDPOINTS.notifications.root), { context: this.noGlobalToastCtx });
  }

  /**
   * Get a single notification by ID
   */
  getNotificationById(id: number): Observable<ResponseApi<NotificationRecord>> {
    return this.http.get<ResponseApi<NotificationRecord>>(buildApiUrl(API_ENDPOINTS.notifications.byId(id)), { context: this.noGlobalToastCtx });
  }

  /**
   * Create a new notification
   */
  createNotification(data: Partial<NotificationRecord>): Observable<ResponseApi<NotificationRecord>> {
    return this.http.post<ResponseApi<NotificationRecord>>(buildApiUrl(API_ENDPOINTS.notifications.root), data, { context: this.noGlobalToastCtx });
  }

  /**
   * Update an existing notification
   */
  updateNotification(id: number, data: Partial<NotificationRecord>): Observable<ResponseApi<void>> {
    return this.http.put<ResponseApi<void>>(buildApiUrl(API_ENDPOINTS.notifications.byId(id)), data, { context: this.noGlobalToastCtx });
  }

  /**
   * Delete a notification
   */
  deleteNotification(id: number): Observable<ResponseApi<void>> {
    return this.http.delete<ResponseApi<void>>(buildApiUrl(API_ENDPOINTS.notifications.byId(id)), { context: this.noGlobalToastCtx });
  }

  /**
   * Send a notification now
   */
  sendNow(id: number): Observable<ResponseApi<void>> {
    return this.http.post<ResponseApi<void>>(buildApiUrl(API_ENDPOINTS.notifications.sendNow(id)), {}, { context: this.noGlobalToastCtx });
  }
}
