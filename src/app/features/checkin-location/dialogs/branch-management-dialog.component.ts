import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { BranchCheckinConfig } from '../../../models/checkin-config.model';
import { CheckinConfigService } from '../../../services/checkin-config.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-branch-management-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, NzModalModule, NzIconModule, NzButtonModule, NzTableModule],
  template: `
    <div class="dialog-content">
      <div class="actions-header">
        <button nz-button nzType="primary" (click)="onAdd()">
          <span nz-icon nzType="plus"></span> Thêm chi nhánh mới
        </button>
      </div>

      <nz-table #branchTable [nzData]="branches" [nzSize]="'middle'" [nzPageSize]="5">
        <thead>
          <tr>
            <th>Tên chi nhánh</th>
            <th>Trạng thái</th>
            <th class="actions-col">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          @for (data of branchTable.data; track data.id) {
            <tr>
              <td>{{ data.name }}</td>
              <td>
                <span class="badge" [class.badge-success]="data.isActive" [class.badge-error]="!data.isActive">
                  {{ data.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit" (click)="onEdit(data)" title="Sửa">
                  <span icon class="custom-icon-edit"></span>
                </button>
                <button class="icon-btn delete" (click)="onDelete(data)" title="Xóa">
                  <span icon class="custom-icon-close"></span>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </nz-table>
    </div>
  `,
  styles: [`
    .dialog-content { padding: 8px 0; }
    .actions-header { margin-bottom: 16px; display: flex; justify-content: flex-end; }
    .actions-col { width: 100px; text-align: center; display: flex; gap: 8px; justify-content: center; }
    
    .icon-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      border: none;
      background: var(--app-color-surface-warm-100);
      cursor: pointer;
      transition: all 0.2s;

      [icon] { font-size: 14px; color: var(--app-color-text-muted); }
      
      &.edit:hover { background: #eff6ff; [icon] { color: #3b82f6; } }
      &.delete:hover { background: #fef2f2; [icon] { color: #ef4444; } }
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      &-success { background: #ecfdf5; color: #10b981; }
      &-error { background: #fef2f2; color: #ef4444; }
    }
  `]
})
export class BranchManagementDialogComponent {
  private readonly modalRef = inject(NzModalRef);
  private readonly modalService = inject(NzModalService);
  private readonly toast = inject(ToastService);
  
  // Data passed from parent
  branches: BranchCheckinConfig[] = [];

  onAdd() {
    this.toast.info('Tính năng Thêm chi nhánh đang được phát triển');
  }

  onEdit(branch: BranchCheckinConfig) {
    this.toast.info(`Sửa chi nhánh: ${branch.name}`);
  }

  onDelete(branch: BranchCheckinConfig) {
    this.modalService.confirm({
      nzTitle: 'Xóa chi nhánh?',
      nzContent: `Bạn có chắc chắn muốn xóa chi nhánh <b>${branch.name}</b>?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.toast.info('Tính năng Xóa chi nhánh đang được phát triển');
      }
    });
  }
}
