import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-notification-pagination',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notification-pagination.component.html',
    styleUrl: './notification-pagination.component.scss',
})
export class NotificationPaginationComponent implements OnChanges {
    @Input() pageIndex = 1;
    @Input() pageSize = 10;
    @Input() total = 0;
    @Input() pageSizeOptions: number[] = [10, 20, 50];
    @Input() displayRange = '';
    @Input() startCount = 3;
    @Input() middleCount = 3;
    @Input() endCount = 3;

    @Output() pageIndexChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() approveAll = new EventEmitter<void>();

    totalPages = 0;
    pages: (number | string)[] = [];

    ngOnChanges(_changes: SimpleChanges): void {
        this.totalPages = Math.ceil(this.total / this.pageSize) || 0;
        this.buildPages();
    }

    private buildPages(): void {
        const total = this.totalPages;

        if (total <= 0) {
            this.pages = [];
            return;
        }

        const current = Math.min(Math.max(this.pageIndex, 1), total);
        this.pages = this.getCustomPagination(total, current);
    }

    private getCustomPagination(totalPage: number, currentPage: number): (number | string)[] {
        if (totalPage <= 6) {
            return Array.from({ length: totalPage }, (_, i) => i + 1);
        }

        const head = [1, 2, 3].filter((p) => p <= totalPage);
        const tailStart = Math.max(totalPage - 2, 1);
        const tail = [tailStart, tailStart + 1, totalPage]
            .filter((p, idx, arr) => p <= totalPage && arr.indexOf(p) === idx);

        // Middle window: current-1, current, current+1, current+2
        let middle = [currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
        middle = middle.filter((p, idx, arr) =>
            p > 3 &&
            p < tail[0] &&
            arr.indexOf(p) === idx
        );

        let result: (number | string)[] = [...head];
        const pushEllipsis = (): void => {
            if (result[result.length - 1] !== '...') {
                result.push('...');
            }
        };

        // Ellipsis between head and middle.
        if (middle.length > 0 && middle[0] > 4) {
            pushEllipsis();
        } else if (middle.length === 0 && totalPage > 6) {
            pushEllipsis();
        }

        result = [...result, ...middle];

        // Ellipsis between middle and tail.
        const lastMiddle = middle.length > 0 ? middle[middle.length - 1] : 3;
        if (tail.length > 0 && lastMiddle < tail[0] - 1) {
            pushEllipsis();
        }

        result = [...result, ...tail];
        return result;
    }

    goToPage(page: number | string): void {
        if (typeof page !== 'number') return;
        this.setPage(page);
    }

    prevPage(): void {
        this.setPage(this.pageIndex - 1);
    }

    nextPage(): void {
        this.setPage(this.pageIndex + 1);
    }

    private setPage(nextPage: number): void {
        if (!Number.isFinite(nextPage)) return;
        if (nextPage < 1 || nextPage > this.totalPages) return;
        if (nextPage === this.pageIndex) return;

        // Update local state first so page number click and nav click behave identically.
        this.pageIndex = nextPage;
        this.buildPages();
        this.pageIndexChange.emit(nextPage);
    }

    trackPage(_index: number, page: number | string): string | number {
        if (typeof page === 'number') {
            return page;
        }
        return `${page}-${_index}`;
    }

    onPageSizeChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.pageSizeChange.emit(Number(value));
    }

    onApproveAll(): void {
        this.approveAll.emit();
    }
}
