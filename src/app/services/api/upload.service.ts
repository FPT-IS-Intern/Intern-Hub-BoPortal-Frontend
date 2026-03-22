import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { buildApiUrl } from '../../core/config/app-config';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { SKIP_API_ERROR_TOAST } from '../../core/interceptors/api-error.interceptor';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly httpClient = inject(HttpClient);
  private readonly noGlobalToastCtx = new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  upload(file: File): Observable<ResponseApi<string>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.httpClient.post<ResponseApi<string>>(buildApiUrl(API_ENDPOINTS.upload.root), formData, { context: this.noGlobalToastCtx });
  }
}
