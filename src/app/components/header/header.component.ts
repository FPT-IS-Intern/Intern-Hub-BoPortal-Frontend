import { Component, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HeaderData {
  logo?: string;
  userName?: string;
  userAvatar?: string;
  notificationsCount?: number;
}

@Component({
  selector: 'app-header-component',
  standalone: true,
  imports: [CommonModule],
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

  isDropdownOpen = false;

  constructor(private eRef: ElementRef) { }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  logout(): void {
    console.log('Logging out...');
    this.isDropdownOpen = false;
  }
}
