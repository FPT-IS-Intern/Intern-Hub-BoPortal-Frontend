import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { DynamicDsService } from 'dynamic-ds';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import {
  StorageUtil,
  cancelTokenRefresh,
  notifyTokenRefreshed,
} from '@goat-bravos/shared-lib-client';

import { HeaderComponent, HeaderData } from './components/header/header.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent],
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  private readonly themeService = inject(DynamicDsService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Thêm trạng thái Header cho toàn ứng dụng
  isLoginRoute = false;
  headerData: HeaderData = {
    logo: 'https://s3.vn-hcm-1.vietnix.cloud/bravos/uploads/a6e2169c-ca10-4b05-ba05-1ec636734f9a.svg',
    userName: 'Diddy',
    email: 'diddy@fpt.com',
    role: 'SUPPER ADMIN',
    notificationsCount: 5,
  };

  private readonly onAuthTokenExpired = this.handleAuthTokenExpired.bind(this);
  private readonly onForceLogout = this.handleForceLogout.bind(this);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.isLoginRoute = event.urlAfterRedirects.includes('/login');
      }
    });
  }

  ngOnInit(): void {
    this.themeService.initializeTheme().subscribe();

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
    this.router.navigate(['/dashboard']);
  }
}
