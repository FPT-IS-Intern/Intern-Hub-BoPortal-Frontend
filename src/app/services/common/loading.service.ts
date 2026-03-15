import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  // Page Loading (Top Progress Bar) - Non-blocking
  private readonly _isPageLoading = signal(false);
  private readonly _debouncedPageLoading = signal(false);
  readonly isPageLoading = this._debouncedPageLoading.asReadonly();

  // Global Loading (Overlay Spinner) - Blocking
  private readonly _isGlobalLoading = signal(false);
  private readonly _debouncedGlobalLoading = signal(false);
  readonly isGlobalLoading = this._debouncedGlobalLoading.asReadonly();

  private pageTimer: any;
  private globalTimer: any;

  showPageLoading(): void {
    this._isPageLoading.set(true);
    if (this.pageTimer) clearTimeout(this.pageTimer);
    this.pageTimer = setTimeout(() => {
      if (this._isPageLoading()) this._debouncedPageLoading.set(true);
    }, 150); // Small delay for top bar
  }

  hidePageLoading(): void {
    this._isPageLoading.set(false);
    if (this.pageTimer) clearTimeout(this.pageTimer);
    this._debouncedPageLoading.set(false);
  }

  showGlobalLoading(): void {
    this._isGlobalLoading.set(true);
    if (this.globalTimer) clearTimeout(this.globalTimer);
    this.globalTimer = setTimeout(() => {
      if (this._isGlobalLoading()) this._debouncedGlobalLoading.set(true);
    }, 250); // 250ms threshold for overlay
  }

  hideGlobalLoading(): void {
    this._isGlobalLoading.set(false);
    if (this.globalTimer) clearTimeout(this.globalTimer);
    this._debouncedGlobalLoading.set(false);
  }

  // Legacy support
  show(): void {
    this.showPageLoading();
  }

  hide(): void {
    this.hidePageLoading();
  }
}
