import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileDropdownComponent } from './user-profile-dropdown/user-profile-dropdown.component';
import { NotificationsDropdownComponent } from './notifications-dropdown/notifications-dropdown.component';

export interface HeaderData {
  logo?: string;
  userName?: string;
  displayName?: string;
  userAvatar?: string;
  notificationsCount?: number;
  email?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
}

@Component({
  selector: 'app-header-component',
  standalone: true,
  imports: [CommonModule, UserProfileDropdownComponent, NotificationsDropdownComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() data: HeaderData = {
    logo: 'https://s3.vn-hcm-1.vietnix.cloud/bravos/uploads/a6e2169c-ca10-4b05-ba05-1ec636734f9a.svg',
    userName: '',
    notificationsCount: 0,
  };

  @Input() showControls = true;
  @Input() paddingHeader = '12px 20px 12px 16px';

  @Output() logoutRequested = new EventEmitter<void>();

  onLogout(): void {
    this.logoutRequested.emit();
  }
}
