import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { API_ENDPOINTS } from '@/core/config/api-endpoints';
import { ApiClientService } from '@/services/api/api-client.service';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly apiClient = inject(ApiClientService);

  upload(file: File): Observable<ResponseApi<string>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.apiClient.post<ResponseApi<string>>(API_ENDPOINTS.upload.root, formData, { skipErrorToast: true });
  }
}
