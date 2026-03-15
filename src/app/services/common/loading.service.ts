import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _isLoading = signal(false);
  readonly isLoading = this._isLoading.asReadonly();

  show(): void {
    console.log('[LoadingService] show');
    this._isLoading.set(true);
  }

  hide(): void {
    console.log('[LoadingService] hide');
    this._isLoading.set(false);
  }
}
