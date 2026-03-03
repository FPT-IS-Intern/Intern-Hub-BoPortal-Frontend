import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonContainerComponent, FunctionalLabelComponent, IconData } from '@goat-bravos/intern-hub-layout';

export interface SidebarItem {
  iconLeft?: IconData | string;
  iconRight?: IconData | string;
  content: string;
  url?: string;
  colorIconLeft?: string;
  colorIconLeftExpanded?: string;
  colorIconLeftHover?: string;
  colorIconRight?: string;
  colorIconRightExpanded?: string;
  colorIconRightHover?: string;
  colorContent?: string;
  colorContentExpanded?: string;
  colorContentHover?: string;
  backgroundColor?: string;
  backgroundColorExpanded?: string;
  backgroundColorHover?: string;
  backgroundColorHoverExpanded?: string;
  borderRadius?: string;
  borderRadiusHover?: string;
  width?: string;
  height?: string;
  children?: SidebarItem[];
  disabled?: boolean;
}

export interface SidebarData {
  menuItems: SidebarItem[];
  backgroundColor?: string;
  collapseIcon?: string;
  expandIcon?: string;
  toggleButtonBackgroundColor?: string;
  closeButtonBackgroundColor?: string;
  toggleButtonIconColor?: string;
  toggleButtonSize?: string;
  toggleButtonBorderRadius?: string;
  toggleButtonPadding?: string;
  toggleButtonWidth?: string;
  toggleButtonHeight?: string;
  closeButtonMarginRight?: string;
  closeButtonMarginLeft?: string;

  // Shared display properties
  defaultWidth?: string;
  defaultHeight?: string;
  defaultBorderRadius?: string;
  defaultColorIconLeft?: string;
  defaultColorContent?: string;
  defaultBackgroundColor?: string;
  defaultColorIconLeftHover?: string;
  defaultColorContentHover?: string;
  defaultBackgroundColorHover?: string;
  activeColorIconLeft?: string;
  activeColorContent?: string;
  activeBackgroundColor?: string;
  disabledColorIconLeft?: string;
  disabledColorContent?: string;
  disabledBackgroundColor?: string;
  defaultColorIconLeftExpanded?: string;
  defaultColorIconRightExpanded?: string;
  defaultColorContentExpanded?: string;
  defaultBackgroundColorExpanded?: string;
  defaultBackgroundColorHoverExpanded?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FunctionalLabelComponent, ButtonContainerComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() data: SidebarData = { menuItems: [] };
  @Input() sidebarWidthCollapse: string = '59px';
  @Input() sidebarWidthExpand: string = '227px';
  @Input() isSidebarExpanded = false;

  @Input() leftIcon?: string;
  @Input() rightIcon?: string;

  @Output() sidebarToggled = new EventEmitter<boolean>();

  @Input() toggleButtonIconData?: IconData[];

  @Input() closeButtonIconData?: IconData[];

  expandedItems: Set<SidebarItem> = new Set();
  activeItem: SidebarItem | null = null;

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
    this.sidebarToggled.emit(this.isSidebarExpanded);
    if (!this.isSidebarExpanded) {
      this.expandedItems.clear(); // Clear expanded menus when collapsing sidebar
    }
  }

  toggleSubMenu(item: SidebarItem, event: Event): void {
    event.stopPropagation();
    const wasExpanded = this.expandedItems.has(item);
    this.expandedItems.clear();
    if (!wasExpanded) {
      this.expandedItems.add(item);
    }
  }

  isItemExpanded(item: SidebarItem): boolean {
    return this.expandedItems.has(item);
  }

  getRightIcon(item: SidebarItem): string | IconData | undefined {
    if (!item.iconRight) return undefined;

    const isExpanded = this.isItemExpanded(item);

    // If it's a string identifier
    if (typeof item.iconRight === 'string') {
      return isExpanded
        ? item.iconRight.replace('down', 'up')
        : item.iconRight.replace('up', 'down');
    }

    // If it's an IconData object
    if (typeof item.iconRight === 'object' && 'icon' in item.iconRight) {
      const iconName = item.iconRight.icon;
      if (!iconName) return item.iconRight;
      return {
        ...item.iconRight,
        icon: isExpanded ? iconName.replace('down', 'up') : iconName.replace('up', 'down'),
      };
    }

    return item.iconRight;
  }

  onMenuItemClick(item: SidebarItem, event: Event): void {
    void event;
    this.activeItem = item;
  }
}
