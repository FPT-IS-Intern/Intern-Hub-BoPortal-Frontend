import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-skeleton.component.html',
  styleUrl: './table-skeleton.component.scss',
})
export class TableSkeletonComponent {
  @Input() columns = 5;
  @Input() rows = 3;
  @Input() columnWidths: string[] = ['20%', '30%', '15%', '15%', '10%'];
  @Input() headerMode: 'columns' | 'single' = 'columns';

  get widths(): string[] {
    return this.columnWidths.length === this.columns
      ? this.columnWidths
      : Array.from({ length: this.columns }, () => `${Math.floor(100 / this.columns)}%`);
  }

  get widthClasses(): string[] {
    return this.widths.map(value => {
      const normalized = `${value}`.replace('%', '').trim();
      return `w-${normalized}`;
    });
  }

  get rowIndexes(): number[] {
    return Array.from({ length: this.rows }, (_, index) => index);
  }
}
