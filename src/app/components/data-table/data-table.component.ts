import { Component, ContentChild, EventEmitter, Input, OnChanges, Output, SimpleChanges, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DataTableColumn {
  key: string;
  label?: string;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  headerClass?: string | string[];
  cellClass?: string | string[];
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T = unknown> implements OnChanges {
  @Input() columns: DataTableColumn[] = [];
  @Input() rows: T[] = [];
  @Input() bodyLoading = false;
  @Input() rowTrackBy?: (index: number, row: T) => unknown;
  @Input() enableRowAlt = true;
  @Input() enableRowHover = true;
  @Input() showPagination = false;

  // Auto pagination visibility (optional):
  // - when enabled, data-table decides whether to show pagination container based on total/pageSize
  // - sticky keeps the bar visible after it has been shown once (until total becomes 0)
  @Input() paginationAuto = false;
  @Input() paginationSticky = false;
  @Input() paginationTotal = 0;
  @Input() paginationPageSize = 10;
  @Input() tableClass: string | string[] = '';
  @Input() wrapperClass: string | string[] = '';
  @Input() emptyColspan?: number;
  @Input() rowClickable = false;

  @Output() rowClick = new EventEmitter<T>();

  @ContentChild('header', { read: TemplateRef }) headerTemplate?: TemplateRef<{ $implicit: DataTableColumn }>;
  @ContentChild('cell', { read: TemplateRef }) cellTemplate?: TemplateRef<{ $implicit: T; col: DataTableColumn; rowIndex: number }>;
  @ContentChild('empty', { read: TemplateRef }) emptyTemplate?: TemplateRef<unknown>;
  @ContentChild('loadingBody', { read: TemplateRef }) loadingBodyTemplate?: TemplateRef<unknown>;
  @ContentChild('pagination', { read: TemplateRef }) paginationTemplate?: TemplateRef<unknown>;

  private paginationEverVisible = false;
  protected resolvedShowPagination = false;

  ngOnChanges(_changes: SimpleChanges): void {
    this.updatePaginationVisibility();
  }

  private updatePaginationVisibility(): void {
    if (!this.paginationAuto) {
      this.resolvedShowPagination = this.showPagination;
      return;
    }

    const total = Number(this.paginationTotal) || 0;
    const pageSize = Number(this.paginationPageSize) || 0;

    if (total <= 0 || pageSize <= 0) {
      this.paginationEverVisible = false;
      this.resolvedShowPagination = false;
      return;
    }

    if (total > pageSize) {
      this.paginationEverVisible = true;
      this.resolvedShowPagination = true;
      return;
    }

    this.resolvedShowPagination = this.paginationSticky && this.paginationEverVisible;
  }

  trackRow = (index: number, row: T): unknown => {
    if (this.rowTrackBy) {
      return this.rowTrackBy(index, row);
    }
    return row;
  };

  get colSpan(): number {
    return this.emptyColspan ?? this.columns.length;
  }

  onRowClick(row: T): void {
    if (!this.rowClickable) {
      return;
    }
    this.rowClick.emit(row);
  }
}
