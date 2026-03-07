import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
    selector: 'app-role-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, NzSelectModule, NzButtonModule, NzIconModule],
    templateUrl: './role-selector.component.html',
    styleUrl: './role-selector.component.scss',
})
export class RoleSelectorComponent {
    @Input() roles: { label: string; value: string }[] = [];
    @Input() selectedRole: string | null = null;
    @Output() roleChange = new EventEmitter<string | null>();
    @Output() refresh = new EventEmitter<void>();

    onRoleChange(value: string | null): void {
        this.roleChange.emit(value);
    }

    onRefresh(): void {
        this.refresh.emit();
    }
}
