import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../../core/config/app-config';
import { SKIP_API_ERROR_TOAST } from '../../core/interceptors/api-error.interceptor';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/common/upload`; // Placeholder, mapping to internal service
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  upload(file: File): Observable<ResponseApi<string>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.httpClient.post<ResponseApi<string>>(this.baseUrl, formData, { context: this.noGlobalToastCtx });
  }
}
