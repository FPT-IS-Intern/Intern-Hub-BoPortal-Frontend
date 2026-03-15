import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  // Page Loading (Top Progress Bar) - Non-blocking
  private readonly _isPageLoading = signal(false);
  readonly isPageLoading = this._isPageLoading.asReadonly();

  // Global Loading (Overlay Spinner) - Blocking
  private readonly _isGlobalLoading = signal(false);
  readonly isGlobalLoading = this._isGlobalLoading.asReadonly();

  // For backward compatibility or general use
  readonly isLoading = this._isPageLoading.asReadonly();

  showPageLoading(): void {
    this._isPageLoading.set(true);
  }

  hidePageLoading(): void {
    this._isPageLoading.set(false);
  }

  showGlobalLoading(): void {
    this._isGlobalLoading.set(true);
  }

  hideGlobalLoading(): void {
    this._isGlobalLoading.set(false);
  }

  // Legacy support
  show(): void {
    this.showPageLoading();
  }

  hide(): void {
    this.hidePageLoading();
  }
}
