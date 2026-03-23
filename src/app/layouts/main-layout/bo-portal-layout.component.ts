import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { HeaderComponent, HeaderData } from '@/components/header/header.component';
import { SidebarComponent, SidebarData } from '@/components/sidebar/sidebar.component';
import { SIDEBAR_ICONS } from '@/core/sidebar-icons';
import { BreadcrumbComponent } from '@/components/breadcrumb/breadcrumb.component';
import { BreadcrumbService } from '@/services/common/breadcrumb.service';
import { AuthService } from '@/services/api/auth.service';
import { StorageUtil } from '@/core/utils/storage.util';

@Component({
  selector: 'app-bo-portal-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent, BreadcrumbComponent],
  templateUrl: './bo-portal-layout.component.html',
  styleUrls: ['./bo-portal-layout.component.scss'],
})
export class BoPortalLayoutComponent {
  protected readonly breadcrumbService = inject(BreadcrumbService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly authService = inject(AuthService);

  constructor() {
    // Clear breadcrumbs immediately on any navigation start to avoid stale titles
    this.router.events.pipe(
      takeUntilDestroyed(),
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      this.breadcrumbService.clearBreadcrumbs();
    });

    this.translate.onLangChange
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.sidebarData = {
          ...this.sidebarData,
          menuItems: this.buildSidebarMenuItems(),
        };
      });

    toObservable(this.authService.userProfile)
      .pipe(takeUntilDestroyed(), filter(Boolean))
      .subscribe((user) => {
        const roleStr = user.roles && user.roles.length > 0
          ? user.roles[0].replace('ROLE_', '').replace(/_/g, ' ')
          : (user.role || 'USER');

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
  // Mobile sidebar state
  isMobileSidebarOpen = false;

  // Desktop sidebar state
  isSidebarExpanded = false;

  headerData: HeaderData = {
    logo: 'https://s3.vn-hcm-1.vietnix.cloud/bravos/uploads/a6e2169c-ca10-4b05-ba05-1ec636734f9a.svg',
    userName: '',
    email: '',
    role: '',
    notificationsCount: 0,
  };

  sidebarData: SidebarData = {
    // ===== Layout =====
    backgroundColor: 'var(--app-color-white)',
    collapseIcon: 'dsi-arrow-left-line',
    expandIcon: 'dsi-arrow-right-line',

    toggleButtonBackgroundColor: 'var(--app-color-primary)',
    toggleButtonIconColor: 'var(--app-color-white)',
    toggleButtonWidth: '32px',
    toggleButtonHeight: '32px',
    toggleButtonSize: 'sm',

    closeButtonBackgroundColor: 'var(--app-color-white)',
    closeButtonMarginRight: '12px',

    // ===== DEFAULT (collapsed & expanded dùng chung) =====
    defaultWidth: '100%',
    defaultHeight: '48px',
    defaultBorderRadius: '8px',

    defaultColorIconLeft: 'var(--app-color-text-muted)',
    defaultColorContent: 'var(--app-color-text-muted)',
    defaultBackgroundColor: 'transparent',

    // ===== HOVER =====
    defaultColorIconLeftHover: 'var(--app-color-primary)',
    defaultColorContentHover: 'var(--app-color-primary)',
    defaultBackgroundColorHover: 'var(--app-color-primary-alpha-8)',

    // ===== ACTIVE =====
    activeColorIconLeft: 'var(--app-color-white)',
    activeColorContent: 'var(--app-color-white)',
    activeBackgroundColor: 'var(--app-color-primary)',

    // ===== DISABLED =====
    disabledColorIconLeft: 'var(--app-color-text-subtle)',
    disabledColorContent: 'var(--app-color-text-subtle)',
    disabledBackgroundColor: 'transparent',

    // ===== EXPANDED MODE OVERRIDE (optional) =====
    defaultColorIconLeftExpanded: 'var(--app-color-text-muted)',
    defaultColorIconRightExpanded: 'var(--app-color-text-muted)',
    defaultColorContentExpanded: 'var(--app-color-text-muted)',
    defaultBackgroundColorExpanded: 'transparent',
    defaultBackgroundColorHoverExpanded: 'var(--app-color-surface-warm-100)',

    // =========================
    // Menu Items
    // =========================
    menuItems: this.buildSidebarMenuItems(),
  };

  toggleButtonIconConfig = SIDEBAR_ICONS.ARROW_RIGHT;
  closeButtonIconConfig = SIDEBAR_ICONS.ARROW_LEFT;

  // Sidebar Toggle Handler
  onSidebarToggle(expanded: boolean): void {
    this.isSidebarExpanded = expanded;
  }

  // Mobile Sidebar Toggle
  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
  }

  protected handleLogout(): void {
    const refreshToken = StorageUtil.getRefreshToken();
    if (!refreshToken) {
      this.forceLogout();
      return;
    }

    this.authService.logout({ refreshToken }).subscribe({
      next: () => this.forceLogout(),
      error: () => this.forceLogout(),
    });
  }

  private buildSidebarMenuItems(): SidebarData['menuItems'] {
    return [
      {
        iconLeft: SIDEBAR_ICONS.USERS,
        content: this.translate.instant('layout.menu.users'),
        url: '/users',
      },
      {
        iconLeft: SIDEBAR_ICONS.SHIELD_PLUS,
        content: this.translate.instant('layout.menu.permissions'),
        url: '/permissions',
      },
      {
        iconLeft: SIDEBAR_ICONS.BELL,
        content: this.translate.instant('layout.menu.notifications'),
        url: '/notifications',
      },
      {
        iconLeft: SIDEBAR_ICONS.GLOBE,
        content: this.translate.instant('layout.menu.checkin'),
        url: '/checkin',
      },
      {
        iconLeft: SIDEBAR_ICONS.MENU,
        content: this.translate.instant('layout.menu.menus'),
        url: '/menus',
      },
      {
        iconLeft: SIDEBAR_ICONS.SETTINGS,
        content: this.translate.instant('layout.menu.systemSettings'),
        url: '/system-settings',
      },
      {
        iconLeft: SIDEBAR_ICONS.PACKAGE_SEARCH,
        content: this.translate.instant('layout.menu.auditLog'),
        url: '/audit-log',
      },
    ];
  }

  private forceLogout(): void {
    StorageUtil.clearAll();
    this.router.navigate(['/login']);
  }
}


