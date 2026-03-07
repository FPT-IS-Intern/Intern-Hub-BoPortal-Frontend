import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NotificationRecord } from '../notification-bell.component';

@Component({
    selector: 'app-notification-table',
    standalone: true,
    imports: [CommonModule, NzTableModule, NzButtonModule, NzIconModule],
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
