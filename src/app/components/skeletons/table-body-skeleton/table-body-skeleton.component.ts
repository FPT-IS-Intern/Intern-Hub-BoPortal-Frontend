import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableBodySkeletonCell {
  columnWidth?: string;
  columnMinWidth?: string;
  width?: string;
  height?: string;
  radius?: string;
  align?: 'start' | 'center' | 'end' | 'stretch';
}

@Component({
  selector: 'app-table-body-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-body-skeleton.component.html',
  styleUrl: './table-body-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableBodySkeletonComponent {
  @Input() rows = 6;
  @Input() rowHeight = 76;
  @Input() cells: TableBodySkeletonCell[] = [];

  get rowIndexes(): number[] {
    return Array.from({ length: this.rows }, (_, index) => index);
  }

  cellJustify(align?: TableBodySkeletonCell['align']): string {
    switch (align) {
      case 'center':
        return 'center';
      case 'end':
        return 'end';
      case 'stretch':
        return 'stretch';
      default:
        return 'start';
    }
  }
}
