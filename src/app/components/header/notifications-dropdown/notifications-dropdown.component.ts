import { Component, Input, HostListener, ElementRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-notifications-dropdown',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notifications-dropdown.component.html',
    styleUrls: ['./notifications-dropdown.component.scss'],
})
export class NotificationsDropdownComponent {
    count = input(0);

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
}
