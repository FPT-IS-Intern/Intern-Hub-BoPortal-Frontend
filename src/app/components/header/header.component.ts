import { Component, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileDropdownComponent } from './user-profile-dropdown/user-profile-dropdown.component';

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
  imports: [CommonModule, UserProfileDropdownComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() data: HeaderData = {
    logo: 'assets/FPT-IS-Logo.png',
    userName: 'Huỳnh Đức Ph...',
    notificationsCount: 0,
  };

  @Input() paddingHeader: string = '12px 20px 12px 16px';

  isNotificationsOpen = false;

  constructor(private eRef: ElementRef) { }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isNotificationsOpen = false;
    }
  }

  logout(): void {
    console.log('Logging out from Header...');
  }
}
