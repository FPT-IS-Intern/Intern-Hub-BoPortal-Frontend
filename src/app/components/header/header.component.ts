import { Component, Input, Output, EventEmitter, input } from '@angular/core';
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
  data = input.required<HeaderData>();
  showControls = input(true);

  @Output() logoutRequested = new EventEmitter<void>();

  onLogout(): void {
    this.logoutRequested.emit();
  }
}
