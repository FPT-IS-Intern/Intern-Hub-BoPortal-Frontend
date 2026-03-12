import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { DynamicDsService } from 'dynamic-ds';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { GeneralConfigService } from './services/general-config.service';
import {
  StorageUtil,
  cancelTokenRefresh,
  notifyTokenRefreshed,
} from './core/utils/storage.util';

import { HeaderComponent, HeaderData } from './components/header/header.component';
import { ToastContainer } from './components/toast-container/toast-container';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent, ToastContainer],
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  private readonly themeService = inject(DynamicDsService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly configService = inject(GeneralConfigService);

  isLoginRoute = false;

  headerData = computed<HeaderData>(() => {
    const user = this.authService.userProfile();
    const config = this.configService.configSignal();
    const defaultLogo = 'https://s3.vn-hcm-1.vietnix.cloud/bravos/uploads/a6e2169c-ca10-4b05-ba05-1ec636734f9a.svg';
    const logo = config?.logoUrl || defaultLogo;

    if (!user) {
      return {
        logo,
        userName: '',
        notificationsCount: 0,
      };
    }

    const roleStr = user.roles && user.roles.length > 0
      ? user.roles[0].replace('ROLE_', '').replace(/_/g, ' ')
      : (user.role || 'USER');

    return {
      logo,
      displayName: user.displayName || user.fullName || user.username || 'User',
      userName: user.username || '',
      email: user.username,
      role: roleStr,
      roles: user.roles || [],
      permissions: user.permissions || [],
      notificationsCount: 0,
    };
  });

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

    // Fetch /me and system config if already logged in to populate header
    if (StorageUtil.getAccessToken()) {
      this.authService.me().subscribe();
      this.configService.getConfig().subscribe();
    }

    window.addEventListener('AUTH_TOKEN_EXPIRED', this.onAuthTokenExpired);
    window.addEventListener('FORCE_LOGOUT', this.onForceLogout);
  }

  // fetchUserProfile is now replaced by service signal observation

  ngOnDestroy(): void {
    window.removeEventListener('AUTH_TOKEN_EXPIRED', this.onAuthTokenExpired);
    window.removeEventListener('FORCE_LOGOUT', this.onForceLogout);
  }

  handleLogout(): void {
    const refreshToken = StorageUtil.getRefreshToken();
    if (!refreshToken) {
      this.handleForceLogout();
      return;
    }

    this.authService.logout({ refreshToken }).subscribe({
      next: () => this.handleForceLogout(),
      error: () => this.handleForceLogout(),
    });
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
