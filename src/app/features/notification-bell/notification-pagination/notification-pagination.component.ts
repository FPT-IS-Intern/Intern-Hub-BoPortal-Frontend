import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-notification-pagination',
    standalone: true,
    imports: [CommonModule],
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

    get totalPages(): number {
        return Math.ceil(this.total / this.pageSize);
    }

    get pageItems(): (number | string)[] {
        const total = this.totalPages;
        const current = this.pageIndex;
        const items: (number | string)[] = [];

        if (total <= 7) {
            for (let i = 1; i <= total; i++) items.push(i);
            return items;
        }

        // Always show first page
        items.push(1);

        if (current <= 4) {
            // Near start: 1, 2, 3, 4, 5, ..., total
            items.push(2, 3, 4, 5, '...', total);
        } else if (current >= total - 3) {
            // Near end: 1, ..., total-4, total-3, total-2, total-1, total
            items.push('...', total - 4, total - 3, total - 2, total - 1, total);
        } else {
            // In middle: 1, ..., curr-1, curr, curr+1, ..., total
            items.push('...', current - 1, current, current + 1, '...', total);
        }

        return items;
    }

    onPageIndexChange(index: number | string): void {
        if (typeof index === 'number' && index !== this.pageIndex && index >= 1 && index <= this.totalPages) {
            this.pageIndexChange.emit(index);
        }
    }

    onPageSizeChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.pageSizeChange.emit(Number(value));
    }

    onApproveAll(): void {
        this.approveAll.emit();
    }
}
