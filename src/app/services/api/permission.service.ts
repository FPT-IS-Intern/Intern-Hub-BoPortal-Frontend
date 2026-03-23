import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { ApiStatus, ResponseApi } from '@goat-bravos/shared-lib-client';
import { PermissionRow } from '@/models/permission.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly successStatus: ApiStatus = {
    code: '200',
    message: 'OK',
  };

  getPermissions(_role: string): Observable<ResponseApi<PermissionRow[]>> {
    return of<ResponseApi<PermissionRow[]>>({
      data: [],
      status: this.successStatus,
      metaData: null,
    }).pipe(delay(500));
  }

  updatePermissions(_role: string, _permissions: PermissionRow[]): Observable<ResponseApi<void>> {
    return of<ResponseApi<void>>({
      data: null,
      status: this.successStatus,
      metaData: null,
    }).pipe(delay(500));
  }
}
