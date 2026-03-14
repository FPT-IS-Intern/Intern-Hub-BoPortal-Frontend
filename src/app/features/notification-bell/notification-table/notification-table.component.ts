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
    @Output() view = new EventEmitter<NotificationRecord>();
    @Output() edit = new EventEmitter<NotificationRecord>();
    @Output() delete = new EventEmitter<NotificationRecord>();
    @Output() sendNow = new EventEmitter<NotificationRecord>();

    onView(record: NotificationRecord): void {
        this.view.emit(record);
    }

    onEdit(record: NotificationRecord): void {
        this.edit.emit(record);
    }

    onDelete(record: NotificationRecord): void {
        this.delete.emit(record);
    }

    onSendNow(record: NotificationRecord): void {
        this.sendNow.emit(record);
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Sent': return 'status-sent';
            case 'Draft': return 'status-draft';
            case 'Scheduled': return 'status-scheduled';
            default: return '';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'Sent': return 'Đã gửi';
            case 'Draft': return 'Nháp';
            case 'Scheduled': return 'Đã lên lịch';
            default: return status;
        }
    }
}
