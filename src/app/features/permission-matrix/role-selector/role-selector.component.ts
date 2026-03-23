import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthzRole } from '@/models/authz.model';
import { DropdownValue, SharedDropdownComponent } from '@/components/shared-dropdown/shared-dropdown.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-role-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, SharedDropdownComponent, TranslateModule],
    templateUrl: './role-selector.component.html',
    styleUrl: './role-selector.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleSelectorComponent {
    roles = input<AuthzRole[]>([]);
    selectedRole = input<string | null>(null);
    roleChange = output<string | null>();

    protected readonly roleOptions = computed(() => {
        return this.roles().map(r => ({ label: r.name, value: r.id }));
    });

    onRoleChange(value: DropdownValue): void {
        this.roleChange.emit(value == null ? null : String(value));
    }
}


