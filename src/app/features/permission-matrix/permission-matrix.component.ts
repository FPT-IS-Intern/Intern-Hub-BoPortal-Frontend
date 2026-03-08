import { Component, ChangeDetectionStrategy, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';
import { RoleSelectorComponent } from './role-selector/role-selector.component';
import { PermissionTableComponent } from './permission-table/permission-table.component';
import { PermissionService } from '../../services/permission.service';
import { PermissionRow } from '../../models/permission.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs';
import { ConfirmPopup } from '../../components/confirm-popup/confirm-popup';

const PERMISSION_COLUMNS = [
  { key: 'create', label: 'Tạo' },
  { key: 'view', label: 'Xem' },
  { key: 'update', label: 'Cập nhật' },
  { key: 'delete', label: 'Xóa' },
  { key: 'approve', label: 'Phê duyệt' },
  { key: 'approver', label: 'Người duyệt' },
  { key: 'crudTask', label: 'CRUD nhiệm vụ' },
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
    ConfirmPopup,
  ],
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.scss',
})
export class PermissionMatrixComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly permissionColumns = PERMISSION_COLUMNS;
  protected readonly roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'User', value: 'user' },
  ];
  protected selectedRole: string | null = 'admin';
  protected permissionRows: PermissionRow[] = [];
  protected isLoading = false;
  protected isConfirmVisible = false;

  ngOnInit(): void {
    this.loadPermissions();
  }

  protected onRoleChange(role: string | null): void {
    this.selectedRole = role;
    if (role) {
      this.loadPermissions();
    } else {
      this.permissionRows = [];
      this.cdr.markForCheck();
    }
  }

  protected onRefresh(): void {
    this.loadPermissions();
  }

  protected loadPermissions(): void {
    if (!this.selectedRole) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.permissionService
      .getPermissions(this.selectedRole)
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
    if (!this.selectedRole) {
      this.message.warning('Vui lòng chọn vai trò');
      return;
    }
    this.isConfirmVisible = true;
  }

  protected handleConfirmSave(): void {
    if (!this.selectedRole) {
      this.isConfirmVisible = false;
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.permissionService
      .updatePermissions(this.selectedRole, this.permissionRows)
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
}
