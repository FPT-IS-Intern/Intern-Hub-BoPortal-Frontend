import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '@/core/config/app-config';
import { SKIP_API_ERROR_TOAST } from '@/core/interceptors/api-error.interceptor';

@Injectable({ providedIn: 'root' })
export class TicketApproverConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/tickets`;
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  getApproverIds(level?: 1 | 2): Observable<ResponseApi<string[]>> {
    const levelParam = level ? `?level=${level}` : '';
    return this.http.get<ResponseApi<string[]>>(`${this.baseUrl}/approvers${levelParam}`, {
      context: this.noGlobalToastCtx,
    });
  }

  assignApprover(approverId: string, level: 1 | 2): Observable<ResponseApi<void>> {
    return this.http.post<ResponseApi<void>>(`${this.baseUrl}/approvers/${approverId}?level=${level}`, {}, {
      context: this.noGlobalToastCtx,
    });
  }

  removeApprover(approverId: string, level?: 1 | 2): Observable<ResponseApi<void>> {
    const levelParam = level ? `?level=${level}` : '';
    return this.http.delete<ResponseApi<void>>(`${this.baseUrl}/approvers/${approverId}${levelParam}`, {
      context: this.noGlobalToastCtx,
    });
  }
}
