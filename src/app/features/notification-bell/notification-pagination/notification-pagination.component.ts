import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
    selector: 'app-notification-pagination',
    standalone: true,
    imports: [CommonModule, FormsModule, NzPaginationModule, NzSelectModule, NzButtonModule, NzIconModule],
    templateUrl: './notification-pagination.component.html',
    styleUrl: './notification-pagination.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPaginationComponent {
    @Input() pageIndex = 1;
    @Input() pageSize = 10;
    @Input() total = 0;
    @Input() pageSizeOptions: number[] = [10, 20, 50];
    @Input() displayRange = '';

    @Output() pageIndexChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() approveAll = new EventEmitter<void>();

    onPageIndexChange(index: number): void {
        this.pageIndexChange.emit(index);
    }

    onPageSizeChange(size: number): void {
        this.pageSizeChange.emit(size);
    }

    onApproveAll(): void {
        this.approveAll.emit();
    }
}
