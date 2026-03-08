import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationRecord } from '../../../core/mock-data/notifications.mock';

@Component({
    selector: 'app-notification-table',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notification-table.component.html',
    styleUrl: './notification-table.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationTableComponent {
    @Input() data: NotificationRecord[] = [];
    @Output() edit = new EventEmitter<NotificationRecord>();

    onEdit(record: NotificationRecord): void {
        this.edit.emit(record);
    }
}
