import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileDropdownComponent } from './user-profile-dropdown/user-profile-dropdown.component';
import { NotificationsDropdownComponent } from './notifications-dropdown/notifications-dropdown.component';

export interface HeaderData {
  logo?: string;
  userName?: string;
  userAvatar?: string;
  notificationsCount?: number;
  email?: string;
  role?: string;
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
    logo: 'assets/FPT-IS-Logo.png',
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
