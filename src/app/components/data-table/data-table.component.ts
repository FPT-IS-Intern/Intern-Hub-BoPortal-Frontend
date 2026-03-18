import { Component, ContentChild, Input, TemplateRef } from '@angular/core';
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
export class DataTableComponent<T = unknown> {
  @Input() columns: DataTableColumn[] = [];
  @Input() rows: T[] = [];
  @Input() rowTrackBy?: (index: number, row: T) => unknown;
  @Input() enableRowAlt = true;
  @Input() enableRowHover = true;
  @Input() showPagination = false;
  @Input() tableClass: string | string[] = '';
  @Input() wrapperClass: string | string[] = '';
  @Input() emptyColspan?: number;

  @ContentChild('header', { read: TemplateRef }) headerTemplate?: TemplateRef<{ $implicit: DataTableColumn }>;
  @ContentChild('cell', { read: TemplateRef }) cellTemplate?: TemplateRef<{ $implicit: T; col: DataTableColumn; rowIndex: number }>;
  @ContentChild('empty', { read: TemplateRef }) emptyTemplate?: TemplateRef<unknown>;
  @ContentChild('pagination', { read: TemplateRef }) paginationTemplate?: TemplateRef<unknown>;

  trackRow = (index: number, row: T): unknown => {
    if (this.rowTrackBy) {
      return this.rowTrackBy(index, row);
    }
    return row;
  };

  get colSpan(): number {
    return this.emptyColspan ?? this.columns.length;
  }
}
