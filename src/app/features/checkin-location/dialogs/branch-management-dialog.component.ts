import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { BranchCheckinConfig } from '../../../models/checkin-config.model';
import { CheckinConfigService } from '../../../services/checkin-config.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-branch-management-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    NzModalModule, 
    NzIconModule, 
    NzButtonModule, 
    NzTableModule,
    NzFormModule,
    NzInputModule,
    NzSwitchModule
  ],
  template: `
    <div class="dialog-content">
      <!-- State: LIST -->
      @if (viewState === 'list') {
        <div class="actions-header">
          <button nz-button nzType="primary" (click)="goToUpsert()">
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
                  <button class="icon-btn edit" (click)="goToUpsert(data)" title="Sửa">
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
      }

      <!-- State: UPSERT -->
      @if (viewState === 'upsert') {
        <form nz-form [formGroup]="branchForm" (ngSubmit)="onSubmit()" nzLayout="vertical">
          <nz-form-item>
            <nz-form-label nzRequired>Tên chi nhánh</nz-form-label>
            <nz-form-control nzErrorTip="Vui lòng nhập tên chi nhánh">
              <input nz-input formControlName="name" placeholder="VD: Chi nhánh Hà Nội" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Mô tả</nz-form-label>
            <nz-form-control>
              <textarea nz-input formControlName="description" rows="3" placeholder="Ghi chú thêm..."></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Trạng thái hoạt động</nz-form-label>
            <nz-form-control>
              <nz-switch formControlName="isActive"></nz-switch>
              <span class="ml-2">{{ branchForm.get('isActive')?.value ? 'Đang hoạt động' : 'Tạm dừng' }}</span>
            </nz-form-control>
          </nz-form-item>

          <div class="form-actions">
            <button nz-button type="button" (click)="viewState = 'list'">Hủy</button>
            <button nz-button nzType="primary" [nzLoading]="isSaving" [disabled]="branchForm.invalid">
              Lưu chi nhánh
            </button>
          </div>
        </form>
      }
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
      display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;
      &-success { background: #ecfdf5; color: #10b981; }
      &-error { background: #fef2f2; color: #ef4444; }
    }

    .form-actions { margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; }
    .ml-2 { margin-left: 8px; }
  `]
})
export class BranchManagementDialogComponent implements OnInit {
  private readonly modalRef = inject(NzModalRef);
  private readonly modalService = inject(NzModalService);
  private readonly checkinService = inject(CheckinConfigService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  
  branches: BranchCheckinConfig[] = [];
  viewState: 'list' | 'upsert' = 'list';
  isSaving = false;
  editingBranch: BranchCheckinConfig | null = null;

  branchForm = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    isActive: [true]
  });

  ngOnInit() {
    // Initial data is passed via nzData, we might want to refresh from API if needed
  }

  goToUpsert(branch?: BranchCheckinConfig) {
    if (branch) {
      this.editingBranch = branch;
      this.branchForm.patchValue({
        name: branch.name,
        description: branch.description || '',
        isActive: branch.isActive
      });
    } else {
      this.editingBranch = null;
      this.branchForm.reset({ isActive: true });
    }
    this.viewState = 'upsert';
  }

  onSubmit() {
    if (this.branchForm.invalid) return;

    this.isSaving = true;
    const value = this.branchForm.value;
    
    const request$ = this.editingBranch 
      ? this.checkinService.updateBranch(this.editingBranch.id, value)
      : this.checkinService.createBranch(value);

    request$.subscribe({
      next: () => {
        this.toast.success(this.editingBranch ? 'Cập nhật chi nhánh thành công' : 'Thêm chi nhánh thành công');
        this.isSaving = false;
        this.modalRef.close(true); // Close with success to trigger refresh
      },
      error: () => {
        this.toast.error('Có lỗi xảy ra khi lưu chi nhánh');
        this.isSaving = false;
      }
    });
  }

  onDelete(branch: BranchCheckinConfig) {
    this.modalService.confirm({
      nzTitle: 'Xóa chi nhánh?',
      nzContent: `Bạn có chắc chắn muốn xóa chi nhánh <b>${branch.name}</b>? Toàn bộ cấu hình check-in của chi nhánh này sẽ bị mất.`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.checkinService.deleteBranch(branch.id).subscribe({
          next: () => {
            this.toast.success('Đã xóa chi nhánh');
            this.modalRef.close(true);
          },
          error: () => this.toast.error('Không thể xóa chi nhánh này')
        });
      }
    });
  }
}
