import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent, HeaderData } from '../../components/header/header.component';
import { SidebarComponent, SidebarData } from '../../components/sidebar/sidebar.component';
import { IconData } from '@goat-bravos/intern-hub-layout';
import { SIDEBAR_ICONS } from '../../core/sidebar-icons';

@Component({
  selector: 'app-bo-portal-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './bo-portal-layout.component.html',
  styleUrls: ['./bo-portal-layout.component.scss'],
})
export class BoPortalLayoutComponent {
  // Mobile sidebar state
  isMobileSidebarOpen = false;

  // Desktop sidebar state
  isSidebarExpanded = false;

  headerData: HeaderData = {
    logo: 'https://s3.vn-hcm-1.vietnix.cloud/bravos/uploads/a6e2169c-ca10-4b05-ba05-1ec636734f9a.svg',
    userName: 'Huỳnh Đức Phú 23',
    email: 'phuhd5@fpt.com',
    role: 'FULLSTACK DEVELOPER',
    notificationsCount: 5,
  };

  sidebarData: SidebarData = {
    // ===== Layout =====
    backgroundColor: 'var(--neutral-color-50)',
    collapseIcon: 'dsi-arrow-left-line',
    expandIcon: 'dsi-arrow-right-line',

    toggleButtonBackgroundColor: 'var(--brand-600)',
    toggleButtonIconColor: 'var(--neutral-color-10)',
    toggleButtonWidth: '32px',
    toggleButtonHeight: '32px',
    toggleButtonSize: 'sm',

    closeButtonBackgroundColor: 'var(--neutral-color-50)',
    closeButtonMarginRight: '12px',

    // ===== DEFAULT (collapsed & expanded dùng chung) =====
    defaultWidth: '100%',
    defaultHeight: '48px',
    defaultBorderRadius: '8px',

    defaultColorIconLeft: 'var(--neutral-color-10)',
    defaultColorContent: 'var(--neutral-color-600)',
    defaultBackgroundColor: 'transparent',

    // ===== HOVER =====
    defaultColorIconLeftHover: 'var(--brand-600)',
    defaultColorContentHover: 'var(--brand-600)',
    defaultBackgroundColorHover: 'var(--brand-50)',

    // ===== ACTIVE =====
    activeColorIconLeft: 'var(--brand-500)',
    activeColorContent: 'var(--brand-500)',
    activeBackgroundColor: 'var(--brand-200)',

    // ===== DISABLED =====
    disabledColorIconLeft: 'var(--neutral-color-300)',
    disabledColorContent: 'var(--neutral-color-300)',
    disabledBackgroundColor: 'transparent',

    // ===== EXPANDED MODE OVERRIDE (optional) =====
    defaultColorIconLeftExpanded: 'var(--neutral-color-400)',
    defaultColorIconRightExpanded: 'var(--neutral-color-400)',
    defaultColorContentExpanded: 'var(--neutral-color-400)',
    defaultBackgroundColorExpanded: 'transparent',
    defaultBackgroundColorHoverExpanded: 'var(--neutral-color-100)',

    // =========================
    // Menu Items
    // =========================
    menuItems: [
      {
        iconLeft: SIDEBAR_ICONS.SETTINGS,
        content: 'Cấu hình chung',
        url: '/general',
      },
      {
        iconLeft: SIDEBAR_ICONS.LOCK,
        content: 'Bảo mật',
        url: '/security',
      },
      {
        iconLeft: SIDEBAR_ICONS.USERS,
        content: 'Ma trận phân quyền',
        url: '/permissions',
      },
      {
        iconLeft: SIDEBAR_ICONS.BELL,
        content: 'Chuông thông báo',
        url: '/notifications',
      },
    ],
  };

  // Data bổ sung truyền vào Input lẻ của SidebarComponent
  toggleButtonIconConfig: IconData[] = [
    {
      ...SIDEBAR_ICONS.ARROW_RIGHT,
      colorIcon: 'var(--neutral-color-10)',
      width: '14px',
      height: '14px',
    },
  ];

  closeButtonIconConfig: IconData[] = [
    {
      ...SIDEBAR_ICONS.ARROW_LEFT,
      colorIcon: 'var(--brand-700)',
      width: '16px',
      height: '16px',
    },
  ];

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
