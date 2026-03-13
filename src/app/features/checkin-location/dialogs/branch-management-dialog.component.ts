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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    SharedSearchComponent,
    TranslateModule
  ],
  templateUrl: './branch-management-dialog.component.html',
  styleUrl: './branch-management-dialog.component.scss'
})
export class BranchManagementDialogComponent implements OnInit {
  private readonly modalRef = inject(NzModalRef);
  private readonly modalService = inject(NzModalService);
  private readonly checkinService = inject(CheckinConfigService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
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
        this.toast.success(
          this.editingBranch
            ? this.translate.instant('checkin.branchDialog.toast.updateSuccess')
            : this.translate.instant('checkin.branchDialog.toast.createSuccess')
        );
        this.isSaving = false;
        this.modalRef.close(true); // Close with success to trigger refresh
      },
      error: () => {
        this.toast.error(this.translate.instant('checkin.branchDialog.toast.saveError'));
        this.isSaving = false;
      }
    });
  }

  onDelete(branch: BranchCheckinConfig) {
    this.modalService.confirm({
      nzTitle: this.translate.instant('checkin.branchDialog.confirmDelete.title'),
      nzContent: this.translate.instant('checkin.branchDialog.confirmDelete.message', { name: branch.name }),
      nzOkText: this.translate.instant('checkin.common.actions.delete'),
      nzOkDanger: true,
      nzOnOk: () => {
        this.checkinService.deleteBranch(branch.id).subscribe({
          next: () => {
            this.toast.success(this.translate.instant('checkin.branchDialog.toast.deleteSuccess'));
            this.modalRef.close(true);
          },
          error: () => this.toast.error(this.translate.instant('checkin.branchDialog.toast.deleteError'))
        });
      }
    });
  }
}
