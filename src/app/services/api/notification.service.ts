import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getBaseUrl } from '../../core/config/app-config';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { NotificationRecord } from '../../models/notification.model';
import { SKIP_API_ERROR_TOAST } from '../../core/interceptors/api-error.interceptor';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/notification-bell`;
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  /**
   * Fetch all notifications
   */
  getNotifications(): Observable<ResponseApi<NotificationRecord[]>> {
    return this.http.get<ResponseApi<NotificationRecord[]>>(this.baseUrl, { context: this.noGlobalToastCtx });
  }

  /**
   * Get a single notification by ID
   */
  getNotificationById(id: number): Observable<ResponseApi<NotificationRecord>> {
    return this.http.get<ResponseApi<NotificationRecord>>(`${this.baseUrl}/${id}`, { context: this.noGlobalToastCtx });
  }

  /**
   * Create a new notification
   */
  createNotification(data: Partial<NotificationRecord>): Observable<ResponseApi<NotificationRecord>> {
    return this.http.post<ResponseApi<NotificationRecord>>(this.baseUrl, data, { context: this.noGlobalToastCtx });
  }

  /**
   * Update an existing notification
   */
  updateNotification(id: number, data: Partial<NotificationRecord>): Observable<ResponseApi<void>> {
    return this.http.put<ResponseApi<void>>(`${this.baseUrl}/${id}`, data, { context: this.noGlobalToastCtx });
  }

  /**
   * Delete a notification
   */
  deleteNotification(id: number): Observable<ResponseApi<void>> {
    return this.http.delete<ResponseApi<void>>(`${this.baseUrl}/${id}`, { context: this.noGlobalToastCtx });
  }

  /**
   * Send a notification now
   */
  sendNow(id: number): Observable<ResponseApi<void>> {
    return this.http.post<ResponseApi<void>>(`${this.baseUrl}/${id}/send-now`, {}, { context: this.noGlobalToastCtx });
  }
}
