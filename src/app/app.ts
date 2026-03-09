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
import { firstValueFrom } from 'rxjs';

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

  isLoginRoute = false;

  headerData: HeaderData = {
    logo: 'assets/FPT-IS-Logo.png',
    userName: '',
    email: '',
    role: '',
    notificationsCount: 0,
  };

  private readonly onAuthTokenExpired = this.handleAuthTokenExpired.bind(this);
  private readonly onForceLogout = this.handleForceLogout.bind(this);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.isLoginRoute = event.urlAfterRedirects.includes('/login');
        // Fetch user info when navigating to a non-login route if not already loaded
        if (!this.isLoginRoute && StorageUtil.getAccessToken()) {
          this.fetchUserProfile();
        }
      }
    });
  }

  async fetchUserProfile() {
    try {
      const res: any = await firstValueFrom(this.authService.me());
      let user: any = null;
      if (res.data && res.data.user) {
        user = res.data.user;
      } else if (res.data) {
        user = res.data;
      } else if (res.user) {
        user = res.user;
      } else {
        user = res;
      }

      if (user && user.username) {
        const roleStr = user.roles && user.roles.length > 0 ? user.roles[0].replace('ROLE_', '').replace(/_/g, ' ') : (user.role || 'USER');

        this.headerData = {
          ...this.headerData,
          userName: user.displayName || user.fullName || user.username || 'User',
          email: user.username,
          role: roleStr,
        };
      }
    } catch (e) {
      console.error('Failed to load user profile in layout:', e);
    }
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
