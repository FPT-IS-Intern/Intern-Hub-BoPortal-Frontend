import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@/services/api/auth.service';
import {
  StorageUtil,
  cancelTokenRefresh,
  notifyTokenRefreshed,
} from './core/utils/storage.util';
import { GlobalOverlaySpinnerComponent } from '@/components/loading/global-overlay-spinner/global-overlay-spinner.component';
import { TopProgressBarComponent } from '@/components/loading/top-progress-bar/top-progress-bar.component';
import { ToastContainer } from './components/toast-container/toast-container';
import { LoadingService } from '@/services/common/loading.service';
import { ToastService } from '@/services/common/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    TopProgressBarComponent,
    ToastContainer,
    GlobalOverlaySpinnerComponent,
  ],
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  protected readonly loadingService = inject(LoadingService);
  protected readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly onAuthTokenExpired = this.handleAuthTokenExpired.bind(this);
  private readonly onForceLogout = this.handleForceLogout.bind(this);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        void event.urlAfterRedirects;
      }
    });
  }

  ngOnInit(): void {
    if (StorageUtil.getAccessToken()) {
      this.authService.me().subscribe();
    }

    window.addEventListener('AUTH_TOKEN_EXPIRED', this.onAuthTokenExpired);
    window.addEventListener('FORCE_LOGOUT', this.onForceLogout);
  }

  ngOnDestroy(): void {
    window.removeEventListener('AUTH_TOKEN_EXPIRED', this.onAuthTokenExpired);
    window.removeEventListener('FORCE_LOGOUT', this.onForceLogout);
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
