import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { HeaderData } from '../../components/header/header.component';
import { SidebarComponent, SidebarData } from '../../components/sidebar/sidebar.component';
import { SIDEBAR_ICONS } from '../../core/sidebar-icons';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { BreadcrumbService } from '../../services/common/breadcrumb.service';

@Component({
  selector: 'app-bo-portal-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, BreadcrumbComponent],
  templateUrl: './bo-portal-layout.component.html',
  styleUrls: ['./bo-portal-layout.component.scss'],
})
export class BoPortalLayoutComponent {
  protected readonly breadcrumbService = inject(BreadcrumbService);
  private readonly router = inject(Router);

  constructor() {
    // Clear breadcrumbs immediately on any navigation start to avoid stale titles
    this.router.events.pipe(
      takeUntilDestroyed(),
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      this.breadcrumbService.clearBreadcrumbs();
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

    // ===== DEFAULT (collapsed & expanded dÃ¹ng chung) =====
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
    menuItems: [
      {
        iconLeft: SIDEBAR_ICONS.USERS,
        content: 'Quáº£n lÃ½ ngÆ°á»i dÃ¹ng',
        url: '/users',
      },
      {
        iconLeft: SIDEBAR_ICONS.SHIELD_PLUS,
        content: 'Ma tráº­n phÃ¢n quyá»n',
        url: '/permissions',
      },
      {
        iconLeft: SIDEBAR_ICONS.BELL,
        content: 'ChuÃ´ng thÃ´ng bÃ¡o',
        url: '/notifications',
      },
      {
        iconLeft: SIDEBAR_ICONS.GLOBE,
        content: 'Äá»‹a Ä‘iá»ƒm checkin',
        url: '/checkin',
      },
      {
        iconLeft: SIDEBAR_ICONS.SETTINGS,
        content: 'Cáº¥u hÃ¬nh há»‡ thá»‘ng',
        url: '/system-settings',
      },
    ],
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
}
