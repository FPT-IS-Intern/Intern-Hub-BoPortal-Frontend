import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthzRole } from '../../../models/authz.model';

@Component({
    selector: 'app-role-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, NzSelectModule, NzButtonModule, NzIconModule],
    templateUrl: './role-selector.component.html',
    styleUrl: './role-selector.component.scss',
})
export class RoleSelectorComponent {
    @Input() roles: AuthzRole[] = [];
    @Input() selectedRole: number | null = null;
    @Output() roleChange = new EventEmitter<number | null>();
    @Output() refresh = new EventEmitter<void>();

    onRoleChange(value: number | null): void {
        this.roleChange.emit(value);
    }

    onRefresh(): void {
        this.refresh.emit();
    }
}
