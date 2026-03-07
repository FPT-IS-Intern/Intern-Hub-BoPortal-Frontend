import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

@Component({
    selector: 'app-permission-table',
    standalone: true,
    imports: [CommonModule, FormsModule, NzCheckboxModule],
    templateUrl: './permission-table.component.html',
    styleUrl: './permission-table.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionTableComponent {
    @Input() columns: readonly any[] = [];
    @Input() rows: any[] = [];
    @Output() permissionChange = new EventEmitter<any[]>();

    onPermissionChange(): void {
        this.permissionChange.emit(this.rows);
    }
}
