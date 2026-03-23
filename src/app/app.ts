import { Component, inject, OnInit, OnDestroy } from '@angular/core';

import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@/services/api/auth.service';
import {
  StorageUtil,
  cancelTokenRefresh,
  notifyTokenRefreshed,
} from '@/core/utils/storage.util';
import { TokenStorageService } from '@/services/common/token-storage.service';
import { LoadingService } from '@/services/common/loading.service';
import { ToastService } from '@/services/common/toast.service';

import { ToastContainer } from '@/components/toast-container/toast-container';
import { GlobalOverlaySpinnerComponent } from '@/components/loading/global-overlay-spinner/global-overlay-spinner.component';
import { TopProgressBarComponent } from '@/components/loading/top-progress-bar/top-progress-bar.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    ToastContainer,
    GlobalOverlaySpinnerComponent,
    TopProgressBarComponent,
  ],
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  isLoginRoute = false;

  private readonly onAuthTokenExpired = this.handleAuthTokenExpired.bind(this);
  private readonly onForceLogout = this.handleForceLogout.bind(this);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isLoginRoute = event.urlAfterRedirects.includes('/login');
      }
    });
  }

  private readonly tokenService = inject(TokenStorageService);
  protected readonly loadingService = inject(LoadingService);
  protected readonly toastService = inject(ToastService);
  private readonly onWindowFocus = this.checkSessionValidity.bind(this);

  ngOnInit(): void {
    // Fetch /me if already logged in to populate header
    if (this.tokenService.isAuthenticated()) {
      this.authService.me().subscribe();
    } else if (this.tokenService.getAccessToken()) {
      // Token exists but is invalid/expired
      this.handleForceLogout();
    }

    window.addEventListener('AUTH_TOKEN_EXPIRED', this.onAuthTokenExpired);
    window.addEventListener('FORCE_LOGOUT', this.onForceLogout);
    window.addEventListener('focus', this.onWindowFocus);
  }

  private checkSessionValidity(): void {
    const token = this.tokenService.getAccessToken();
    if (token && this.tokenService.isAccessTokenExpired()) {
      console.warn('App: session expired on focus, triggering refresh/logout');
      this.handleAuthTokenExpired();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('AUTH_TOKEN_EXPIRED', this.onAuthTokenExpired);
    window.removeEventListener('FORCE_LOGOUT', this.onForceLogout);
    window.removeEventListener('focus', this.onWindowFocus);
  }

  private handleAuthTokenExpired(): void {
    const refreshToken = StorageUtil.getRefreshToken();
    if (!refreshToken) {
      this.handleForceLogout();
      return;
    }

    this.authService.refreshAccessToken({ refreshToken }).subscribe({
      next: (response) => {
        const newAccessToken = response.data?.accessToken;
        const newRefreshToken = response.data?.refreshToken;

        if (newAccessToken) {
          StorageUtil.setAccessToken(newAccessToken);
          if (newRefreshToken) StorageUtil.setRefreshToken(newRefreshToken);
          notifyTokenRefreshed(newAccessToken);
        } else {
          this.handleForceLogout();
        }
      },
      error: () => {
        this.handleForceLogout();
      },
    });
  }

  private handleForceLogout(): void {
    cancelTokenRefresh();
    StorageUtil.clearAll();
    this.router.navigate(['/login']);
  }
}
