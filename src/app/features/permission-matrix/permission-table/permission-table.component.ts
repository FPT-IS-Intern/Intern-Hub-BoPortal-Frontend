import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NoDataComponent } from '@/components/no-data/no-data.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaginationComponent } from '@/components/pagination/pagination.component';
import { DataTableColumn, DataTableComponent } from '@/components/data-table/data-table.component';

@Component({
    selector: 'app-permission-table',
    standalone: true,
    imports: [CommonModule, FormsModule, NoDataComponent, TranslateModule, PaginationComponent, DataTableComponent],
    templateUrl: './permission-table.component.html',
    styleUrl: './permission-table.component.scss',
})
export class PermissionTableComponent {
    @Input() columns: readonly any[] = [];
    @Input() rows: any[] = [];
    @Output() permissionChange = new EventEmitter<any[]>();

    pageIndex = 1;
    pageSize = 10;

    get total(): number {
        return this.rows.length;
    }

    get pagedRows(): any[] {
        const start = (this.pageIndex - 1) * this.pageSize;
        return this.rows.slice(start, start + this.pageSize);
    }

    get displayRange(): string {
        if (this.total === 0) return '';
        const start = (this.pageIndex - 1) * this.pageSize + 1;
        const end = Math.min(this.pageIndex * this.pageSize, this.total);
        return `${start}-${end}/${this.total}`;
    }

    onPageIndexChange(next: number): void {
        this.pageIndex = next;
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.pageIndex = 1;
    }
    onPermissionChange(): void {
        this.permissionChange.emit(this.rows);
    }

    get tableColumns(): DataTableColumn[] {
        const base: DataTableColumn = {
            key: '__resource',
            label: 'permissionMatrix.table.resource',
            headerClass: 'col-function sticky-col',
            cellClass: 'col-function cell-function sticky-col',
            align: 'left',
            width: '320px',
            minWidth: '250px',
        };
        const permissions = this.columns.map(col => ({
            key: col.key,
            label: col.label,
            headerClass: 'col-permission sticky-header',
            cellClass: 'col-permission cell-checkbox',
            align: 'center',
            width: '120px',
            minWidth: '100px',
        })) as DataTableColumn[];

        return [base, ...permissions];
    }
}


