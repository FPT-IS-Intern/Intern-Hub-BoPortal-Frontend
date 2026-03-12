import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationRecord } from '../../../models/notification.model';
import { NoDataComponent } from '../../../components/no-data/no-data.component';

@Component({
    selector: 'app-notification-table',
    standalone: true,
    imports: [CommonModule, NoDataComponent],
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
