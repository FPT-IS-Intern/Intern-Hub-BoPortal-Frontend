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


    @Output() pageIndexChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() approveAll = new EventEmitter<void>();

    totalPages = 0;
    pages: (number | string)[] = [];

    ngOnChanges(_changes: SimpleChanges): void {
        this.totalPages = Math.ceil(this.total / this.pageSize) || 0;
        this.buildPages();
    }

    private currentMiddle: number[] = [];

    private buildPages(): void {
        const total = this.totalPages;

        if (total <= 0) {
            this.pages = [];
            return;
        }

        // Clamp page index
        this.pageIndex = Math.min(Math.max(this.pageIndex, 1), total);

        // Cập nhật lại dải pages (có state)
        this.pages = this.getCustomPagination(total, this.pageIndex);
    }

    private getCustomPagination(totalPage: number, currentPage: number): (number | string)[] {
        const midSize = 4; // Số lượng index ở giữa

        // 1. Nếu total nhỏ (ví dụ <= 6), hiện tất cả không cần ...
        if (totalPage <= 6) {
            return Array.from({ length: totalPage }, (_, i) => i + 1);
        }

        // 2. XỬ LÝ VÙNG ĐẦU (Nếu đang ở trang 1, 2)
        if (currentPage < 3) {
            this.currentMiddle = []; // Reset state
            return [1, 2, 3, '...', totalPage];
        }

        // 3. XỬ LÝ VÙNG CUỐI (Nếu đang ở sát nút cuối)
        if (currentPage > totalPage - 2) {
            this.currentMiddle = []; // Reset state
            return [1, '...', totalPage - 2, totalPage - 1, totalPage];
        }

        // 4. XỬ LÝ VÙNG GIỮA (Phân bổ động có nhớ trạng thái)

        // Nếu chuyển từ vùng đầu/cuối vào màn giữa, khởi tạo dải middle
        if (this.currentMiddle.length === 0) {
            this.currentMiddle = Array.from({ length: midSize }, (_, i) => Math.min(currentPage + i, totalPage - 1));
        } else {
            // Kiểm tra click chạm biên để dịch chuyển khung middle
            const first = this.currentMiddle[0];
            const last = this.currentMiddle[this.currentMiddle.length - 1];

            if (currentPage <= first && first > 2) {
                // Click vào mép trái (hoặc nhảy trang vượt quá) -> trượt sang trái
                const newFirst = Math.max(3, currentPage - 1);
                this.currentMiddle = Array.from({ length: midSize }, (_, i) => newFirst + i);
            } else if (currentPage >= last && last < totalPage - 1) {
                // Click vào mép phải -> trượt sang phải
                const newFirst = Math.min(currentPage - (midSize - 2), totalPage - midSize);
                // Đảm bảo newFirst không nhỏ hơn 3
                const safeFirst = Math.max(3, newFirst);
                this.currentMiddle = Array.from({ length: midSize }, (_, i) => safeFirst + i);
            }
            // Ngược lại: Click số ở giữa khung -> Không dịch chuyển (khung giữ nguyên)
        }

        const res: (number | string)[] = [];
        res.push(1);

        if (this.currentMiddle[0] > 2) {
            res.push('...');
        }

        res.push(...this.currentMiddle);

        if (this.currentMiddle[this.currentMiddle.length - 1] < totalPage - 1) {
            res.push('...');
        }

        res.push(totalPage);
        return res;
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
