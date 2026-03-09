import { Component, ChangeDetectionStrategy, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';
import { RoleSelectorComponent } from './role-selector/role-selector.component';
import { PermissionTableComponent } from './permission-table/permission-table.component';
import { CreateRoleDialogComponent } from './create-role-dialog/create-role-dialog.component';
import { CreateResourceDialogComponent } from './create-resource-dialog/create-resource-dialog.component';
import { PermissionService } from '../../services/permission.service';
import { AuthzService } from '../../services/authz.service';
import { PermissionRow } from '../../models/permission.model';
import { AuthzRole, ResourcePermission } from '../../models/authz.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs';
import { ConfirmPopup } from '../../components/popups/confirm-popup/confirm-popup';

const PERMISSION_COLUMNS = [
  { key: 'create', label: 'Tạo' },
  { key: 'view', label: 'Xem' },
  { key: 'update', label: 'Cập nhật' },
  { key: 'delete', label: 'Xóa' },
  { key: 'approve', label: 'Phê duyệt' },
] as const;

@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzBreadCrumbModule,
    NzButtonModule,
    NzIconModule,
    RoleSelectorComponent,
    PermissionTableComponent,
    CreateRoleDialogComponent,
    CreateResourceDialogComponent,
    ConfirmPopup,
  ],
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.scss',
})
export class PermissionMatrixComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly authzService = inject(AuthzService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly permissionColumns = PERMISSION_COLUMNS;
  protected roles: AuthzRole[] = [];
  protected selectedRoleId: number | null = null;
  protected permissionRows: PermissionRow[] = [];
  protected isLoading = false;
  protected isConfirmVisible = false;
  protected isCreateRoleVisible = false;
  protected isCreateResourceVisible = false;

  ngOnInit(): void {
    this.loadRoles();
  }

  protected loadRoles(): void {
    this.authzService.getRoles().subscribe({
      next: (res) => {
        if (res.data) {
          this.roles = res.data;
          if (this.roles.length > 0 && this.selectedRoleId == null) {
            this.selectedRoleId = this.roles[0].id;
            this.loadPermissions();
          }
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Load roles error:', err);
        this.message.error('Không thể tải danh sách vai trò');
      },
    });
  }

  protected onRoleChange(roleId: number | null): void {
    this.selectedRoleId = roleId;
    if (roleId != null) {
      this.loadPermissions();
    } else {
      this.permissionRows = [];
      this.cdr.markForCheck();
    }
  }

  protected onRefresh(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  protected loadPermissions(): void {
    if (this.selectedRoleId == null) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    // TODO: Replace with real GET permissions-by-role API when available
    this.permissionService
      .getPermissions(String(this.selectedRoleId))
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.permissionRows = res.data;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Load permissions error:', err);
          this.message.error('Không thể tải dữ liệu phân quyền');
        },
      });
  }

  protected onSubmit(): void {
    if (this.selectedRoleId == null) {
      this.message.warning('Vui lòng chọn vai trò');
      return;
    }
    this.isConfirmVisible = true;
  }

  protected handleConfirmSave(): void {
    if (this.selectedRoleId == null) {
      this.isConfirmVisible = false;
      return;
    }

    const resources: ResourcePermission[] = this.permissionRows
      .filter(row => row.resourceId != null)
      .map(row => ({
        id: row.resourceId!,
        permissions: [
          row.create ? 1 : 0,
          row.view ? 1 : 0,
          row.update ? 1 : 0,
          row.delete ? 1 : 0,
          row.approve ? 1 : 0,
        ],
      }));

    if (resources.length === 0) {
      this.message.warning('Không có tài nguyên nào có ID để cập nhật quyền');
      this.isConfirmVisible = false;
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.authzService
      .updateRolePermissions(this.selectedRoleId, resources)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.message.success('Cập nhật phân quyền thành công');
          this.isConfirmVisible = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Update permissions error:', err);
          this.message.error('Cập nhật phân quyền thất bại');
          this.isConfirmVisible = false;
          this.cdr.markForCheck();
        },
      });
  }

  protected handleConfirmCancel(): void {
    this.isConfirmVisible = false;
  }

  protected onCreateRole(event: { name: string; description: string }): void {
    this.authzService.createRole(event.name, event.description).subscribe({
      next: () => {
        this.message.success('Tạo vai trò thành công');
        this.isCreateRoleVisible = false;
        this.loadRoles();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Create role error:', err);
        this.message.error('Tạo vai trò thất bại');
      },
    });
  }

  protected onCreateResource(event: { name: string; code: string; description: string }): void {
    this.authzService.createResource(event.name, event.code, event.description).subscribe({
      next: (res) => {
        this.message.success('Tạo tài nguyên thành công');
        this.isCreateResourceVisible = false;
        if (res.data) {
          this.permissionRows = [
            ...this.permissionRows,
            {
              resourceId: res.data.id,
              function: res.data.name,
              create: false,
              view: false,
              update: false,
              delete: false,
              approve: false,
              approver: false,
              crudTask: false,
            },
          ];
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Create resource error:', err);
        this.message.error('Tạo tài nguyên thất bại');
      },
    });
  }
}
