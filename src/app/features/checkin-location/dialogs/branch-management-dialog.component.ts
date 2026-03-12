import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { BranchCheckinConfig } from '../../../models/checkin-config.model';
import { CheckinConfigService } from '../../../services/checkin-config.service';
import { ToastService } from '../../../services/toast.service';
import { SharedSearchComponent } from '../../../components/shared-search/shared-search.component';

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
    SharedSearchComponent
  ],
  templateUrl: './branch-management-dialog.component.html',
  styleUrl: './branch-management-dialog.component.scss'
})
export class BranchManagementDialogComponent implements OnInit {
  private readonly modalRef = inject(NzModalRef);
  private readonly modalService = inject(NzModalService);
  private readonly checkinService = inject(CheckinConfigService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly modalData = inject<{ branches: BranchCheckinConfig[] }>(NZ_MODAL_DATA, { optional: true });
  
  protected readonly branches = signal<BranchCheckinConfig[]>([]);
  protected readonly searchQuery = signal('');
  
  protected readonly filteredBranches = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.branches();
    return this.branches().filter(b => 
      b.name.toLowerCase().includes(query) || 
      (b.description?.toLowerCase().includes(query))
    );
  });

  protected readonly scrollConfig = computed(() => {
    return this.filteredBranches().length > 6 ? { y: '350px' } : null;
  });

  viewState: 'list' | 'upsert' = 'list';
  isSaving = false;
  editingBranch: BranchCheckinConfig | null = null;

  branchForm = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    isActive: [true]
  });

  ngOnInit() {
    if (this.modalData?.branches) {
      this.branches.set([...this.modalData.branches]);
    }
  }

  onSearch(value: string) {
    this.searchQuery.set(value);
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
