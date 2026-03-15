import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NoDataComponent } from '../../../components/no-data/no-data.component';

@Component({
    selector: 'app-permission-table',
    standalone: true,
    imports: [CommonModule, FormsModule, NoDataComponent],
    templateUrl: './permission-table.component.html',
    styleUrl: './permission-table.component.scss',
})
export class PermissionTableComponent {
    @Input() columns: readonly any[] = [];
    @Input() rows: any[] = [];
    @Output() permissionChange = new EventEmitter<any[]>();

    onPermissionChange(): void {
        this.permissionChange.emit(this.rows);
    }
}
