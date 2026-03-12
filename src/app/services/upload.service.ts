import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = `${getBaseUrl()}/bo-portal/common/upload`; // Placeholder, mapping to internal service

  upload(file: File): Observable<ResponseApi<string>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.httpClient.post<ResponseApi<string>>(this.baseUrl, formData);
  }
}
