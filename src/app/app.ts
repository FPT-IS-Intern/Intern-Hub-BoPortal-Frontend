import { Component, inject, OnInit, OnDestroy } from '@angular/core';

import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import {
  StorageUtil,
  cancelTokenRefresh,
  notifyTokenRefreshed,
} from './core/utils/storage.util';

import { HeaderComponent, HeaderData } from './components/header/header.component';
import { ToastContainer } from './components/toast-container/toast-container';
import { GlobalOverlaySpinnerComponent } from './components/global-overlay-spinner/global-overlay-spinner.component';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    HeaderComponent,
    ToastContainer,
    GlobalOverlaySpinnerComponent,
  ],
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  isLoginRoute = false;

  headerData: HeaderData = {
    logo: 'https://s3.vn-hcm-1.vietnix.cloud/bravos/uploads/a6e2169c-ca10-4b05-ba05-1ec636734f9a.svg',
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
      }
    });

    // React to user profile changes
    toObservable(this.authService.userProfile)
      .pipe(takeUntilDestroyed(), filter(Boolean))
      .subscribe((user: any) => {
        const roleStr = user.roles && user.roles.length > 0 ? user.roles[0].replace('ROLE_', '').replace(/_/g, ' ') : (user.role || 'USER');

        this.headerData = {
          ...this.headerData,
          displayName: user.displayName || user.fullName || user.username || 'User',
          userName: user.username || '',
          email: user.username,
          role: roleStr,
          roles: user.roles || [],
          permissions: user.permissions || [],
        };
      });
  }

  ngOnInit(): void {
    // Fetch /me if already logged in to populate header
    if (StorageUtil.getAccessToken()) {
      this.authService.me().subscribe();
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
