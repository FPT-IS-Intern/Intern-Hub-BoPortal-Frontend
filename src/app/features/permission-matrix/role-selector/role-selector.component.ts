import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthzRole } from '../../../models/authz.model';
import { SharedDropdownComponent, DropdownOption } from '../../../components/shared-dropdown/shared-dropdown.component';

@Component({
    selector: 'app-role-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, SharedDropdownComponent],
    templateUrl: './role-selector.component.html',
    styleUrl: './role-selector.component.scss',
})
export class RoleSelectorComponent {
    @Input() roles: AuthzRole[] = [];
    @Input() selectedRole: string | null = null;
    @Output() roleChange = new EventEmitter<string | null>();

    protected readonly roleOptions = computed(() => {
        return this.roles.map(r => ({ label: r.name, value: r.id }));
    });

    onRoleChange(value: string | null): void {
        this.roleChange.emit(value);
    }
}
