import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NoDataComponent } from '@/components/no-data/no-data.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaginationComponent } from '@/components/pagination/pagination.component';
import { DataTableColumn, DataTableComponent } from '@/components/data-table/data-table.component';
import { PermissionColumn, PermissionRow } from '@/models/permission.model';

@Component({
    selector: 'app-permission-table',
    standalone: true,
    imports: [CommonModule, FormsModule, NoDataComponent, TranslateModule, PaginationComponent, DataTableComponent],
    templateUrl: './permission-table.component.html',
    styleUrl: './permission-table.component.scss',
})
export class PermissionTableComponent {
    @Input() columns: readonly PermissionColumn[] = [];
    @Input() rows: PermissionRow[] = [];
    @Output() permissionChange = new EventEmitter<PermissionRow[]>();
    @Output() ticketApproverConfig = new EventEmitter<{ level: 1 | 2 }>();

    pageIndex = 1;
    pageSize = 10;

    get total(): number {
        return this.rows.length;
    }

    get pagedRows(): PermissionRow[] {
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
        // Keep approval permission consistent: level 2 implies level 1.
        const level1 = this.rows.find(r => (r.resourceCode ?? '').trim() === 'duyet-phieu-yeu-cau-cap-1');
        const level2 = this.rows.find(r => (r.resourceCode ?? '').trim() === 'duyet-phieu-yeu-cau-cap-2');
        if (level1 && level2 && level2.approve && !level1.approve) {
            level1.approve = true;
        }
        this.permissionChange.emit(this.rows);
    }

    requestTicketApproverConfig(row: PermissionRow): void {
        const code = (row.resourceCode ?? '').trim();
        if (code === 'duyet-phieu-yeu-cau-cap-1') {
            this.ticketApproverConfig.emit({ level: 1 });
        } else if (code === 'duyet-phieu-yeu-cau-cap-2') {
            this.ticketApproverConfig.emit({ level: 2 });
        }
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
