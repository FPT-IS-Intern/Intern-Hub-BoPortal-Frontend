import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent implements OnChanges {
  @Input() pageIndex = 1;
  @Input() pageSize = 10;
  @Input() total = 0;
  @Input() pageSizeOptions: number[] = [10, 20, 50];
  @Input() displayRange = '';

  @Output() pageIndexChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

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

    this.pages = this.getCustomPagination(total, this.pageIndex);
  }

  private getCustomPagination(totalPage: number, currentPage: number): (number | string)[] {
    const midSize = 4;

    if (totalPage <= 6) {
      return Array.from({ length: totalPage }, (_, i) => i + 1);
    }

    if (currentPage < 3) {
      this.currentMiddle = [];
      return [1, 2, 3, '...', totalPage];
    }

    if (currentPage > totalPage - 2) {
      this.currentMiddle = [];
      return [1, '...', totalPage - 2, totalPage - 1, totalPage];
    }

    if (this.currentMiddle.length === 0) {
      this.currentMiddle = Array.from({ length: midSize }, (_, i) => Math.min(currentPage + i, totalPage - 1));
    } else {
      const first = this.currentMiddle[0];
      const last = this.currentMiddle[this.currentMiddle.length - 1];

      if (currentPage <= first && first > 2) {
        const newFirst = Math.max(3, currentPage - 1);
        this.currentMiddle = Array.from({ length: midSize }, (_, i) => newFirst + i);
      } else if (currentPage >= last && last < totalPage - 1) {
        const newFirst = Math.min(currentPage - (midSize - 2), totalPage - midSize);
        const safeFirst = Math.max(3, newFirst);
        this.currentMiddle = Array.from({ length: midSize }, (_, i) => safeFirst + i);
      }
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
}
