import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderData } from '../header.component';

@Component({
    selector: 'app-user-profile-dropdown',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-profile-dropdown.component.html',
    styleUrls: ['./user-profile-dropdown.component.scss'],
})
export class UserProfileDropdownComponent {
    @Input() data!: HeaderData;
    @Output() logout = new EventEmitter<void>();

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

    onLogout(): void {
        this.logout.emit();
        this.isDropdownOpen = false;
    }
}
