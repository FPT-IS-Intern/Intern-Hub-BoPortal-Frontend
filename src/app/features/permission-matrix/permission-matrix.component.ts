import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';
import { RoleSelectorComponent } from './role-selector/role-selector.component';
import { PermissionTableComponent } from './permission-table/permission-table.component';

const PERMISSION_COLUMNS = [
  { key: 'create', label: 'Tạo' },
  { key: 'view', label: 'Xem' },
  { key: 'update', label: 'Cập nhật' },
  { key: 'delete', label: 'Xóa' },
  { key: 'approve', label: 'Phê duyệt' },
  { key: 'approver', label: 'Người duyệt' },
  { key: 'crudTask', label: 'CRUD nhiệm vụ' },
] as const;

const PERMISSION_ROWS = [
  'Cấu hình hệ thống',
  'Quản lý danh mục',
  'Quản lý người dùng',
  'Quản lý phiếu yêu cầu',
  'Quản lý chấm công',
  'Quản lý dự án',
  'Đánh giá',
  'Tin tức',
  'Lộ trình học tập',
  'Hòm thư góp ý',
];

export interface PermissionRow {
  function: string;
  create: boolean;
  view: boolean;
  update: boolean;
  delete: boolean;
  approve: boolean;
  approver: boolean;
  crudTask: boolean;
}

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
export class PermissionMatrixComponent {
  protected readonly permissionColumns = PERMISSION_COLUMNS;
  protected readonly roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'User', value: 'user' },
  ];
  protected selectedRole: string | null = null;
  protected permissionRows: PermissionRow[];

  constructor() {
    this.permissionRows = PERMISSION_ROWS.map((fn) => ({
      function: fn,
      create: false,
      view: fn === 'Quản lý phiếu yêu cầu',
      update: false,
      delete: false,
      approve: false,
      approver: false,
      crudTask: false,
    }));
  }

  protected onRefresh(): void {
    // TODO: Load permissions for selected role
    console.log('Refresh permissions for role:', this.selectedRole);
  }

  protected onSubmit(): void {
    console.log('Apply permissions:', this.permissionRows);
    // TODO: Gọi API lưu ma trận phân quyền
  }
}
