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
import { AuthzService } from '../../services/authz.service';
import { PermissionRow } from '../../models/permission.model';
import { AuthzRole, AuthzResource, AuthzRolePermission, ResourcePermission } from '../../models/authz.model';
import { ToastService } from '../../services/toast.service';
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
  private readonly authzService = inject(AuthzService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly permissionColumns = PERMISSION_COLUMNS;
  protected roles: AuthzRole[] = [];
  protected allResources: AuthzResource[] = [];
  protected selectedRoleId: string | null = null;
  protected permissionRows: PermissionRow[] = [];
  protected isLoading = false;
  protected isConfirmVisible = false;
  protected isCreateRoleVisible = false;
  protected isCreateResourceVisible = false;

  ngOnInit(): void {
    this.loadResources();
    this.loadRoles();
  }

  protected loadResources(): void {
    this.authzService.getAllResources().subscribe({
      next: (res) => {
        if (res.data) {
          this.allResources = res.data;
          this.buildPermissionRows();
          this.cdr.markForCheck();
          console.log("All Resources:", res.data);
        }
      },
      error: (err) => {
        console.error('Load resources error:', err);
        this.toastService.error('Không thể tải danh sách tài nguyên');
      },
    });
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
        this.toastService.error('Không thể tải danh sách vai trò');
      },
    });
  }

  protected onRoleChange(roleId: string | null): void {
    this.selectedRoleId = roleId;
    if (roleId != null) {
      this.loadPermissions();
    } else {
      this.buildPermissionRows();
      this.cdr.markForCheck();
    }
  }

  protected onRefresh(): void {
    this.loadResources();
    this.loadRoles();
    if (this.selectedRoleId != null) {
      this.loadPermissions();
    }
  }

  protected loadPermissions(): void {
    if (this.selectedRoleId == null) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.authzService
      .getRolePermissions(this.selectedRoleId)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.buildPermissionRows(res.data);
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Load permissions error:', err);
          this.toastService.error('Không thể tải dữ liệu phân quyền');
        },
      });
  }

  private buildPermissionRows(rolePermissions: AuthzRolePermission[] = []): void {
    const permMap = new Map<string, string[]>();
    for (const p of rolePermissions) {
      permMap.set(String(p.resource.id), p.permissions ?? []);
    }

    this.permissionRows = this.allResources.map((resource) => {
      const actions = permMap.get(String(resource.id)) ?? [];
      console.log("ResourceId:", resource.id, "Actions:", actions, "Name:", resource.name);
      return {
        resourceId: resource.id,
        function: resource.name,
        create: actions.includes('create'),
        view: actions.includes('read'),
        update: actions.includes('update'),
        delete: actions.includes('delete'),
        approve: actions.includes('review'),
        approver: false,
        crudTask: false,
      };
    });
  }

  protected onSubmit(): void {
    if (this.selectedRoleId == null) {
      this.toastService.warning('Vui lòng chọn vai trò');
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
      this.toastService.warning('Không có tài nguyên nào có ID để cập nhật quyền');
      this.isConfirmVisible = false;
      this.cdr.markForCheck();
      return;
    }

    this.isConfirmVisible = false;
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
          this.toastService.success('Cập nhật phân quyền thành công');
          this.loadPermissions();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Update permissions error:', err);
          this.toastService.error('Cập nhật phân quyền thất bại');
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
        this.toastService.success('Tạo vai trò thành công');
        this.isCreateRoleVisible = false;
        this.loadRoles();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Create role error:', err);
        this.toastService.error('Tạo vai trò thất bại');
        this.cdr.markForCheck();
      },
    });
  }

  protected onCreateResource(event: { name: string; code: string; description: string }): void {
    this.authzService.createResource(event.name, event.code, event.description).subscribe({
      next: (res) => {
        this.toastService.success('Tạo tài nguyên thành công');
        this.isCreateResourceVisible = false;
        this.loadResources();
        if (this.selectedRoleId != null) {
          this.loadPermissions();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Create resource error:', err);
        this.toastService.error('Tạo tài nguyên thất bại');
        this.cdr.markForCheck();
      },
    });
  }
}
