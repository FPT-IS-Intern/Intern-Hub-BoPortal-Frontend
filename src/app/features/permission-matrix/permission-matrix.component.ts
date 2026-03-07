import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
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
  ],
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionMatrixComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly message = inject(NzMessageService);

  protected readonly permissionColumns = PERMISSION_COLUMNS;
  protected readonly roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'User', value: 'user' },
  ];
  protected selectedRole: string | null = 'admin';
  protected permissionRows: PermissionRow[] = [];
  protected isLoading = false;

  ngOnInit(): void {
    this.loadPermissions();
  }

  protected onRoleChange(role: string | null): void {
    this.selectedRole = role;
    if (role) {
      this.loadPermissions();
    } else {
      this.permissionRows = [];
    }
  }

  protected onRefresh(): void {
    this.loadPermissions();
  }

  protected loadPermissions(): void {
    if (!this.selectedRole) return;

    this.isLoading = true;
    this.permissionService
      .getPermissions(this.selectedRole)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.permissionRows = res.data;
          } else {
            this.message.error(res.message || 'Không thể tải dữ liệu phân quyền');
          }
        },
        error: () => this.message.error('Lỗi kết nối máy chủ'),
      });
  }

  protected onSubmit(): void {
    if (!this.selectedRole) {
      this.message.warning('Vui lòng chọn vai trò');
      return;
    }

    this.isLoading = true;
    this.permissionService
      .updatePermissions(this.selectedRole, this.permissionRows)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.message.success('Cập nhật phân quyền thành công');
          } else {
            this.message.error(res.message || 'Cập nhật thất bại');
          }
        },
        error: () => this.message.error('Lỗi kết nối máy chủ'),
      });
  }
}
