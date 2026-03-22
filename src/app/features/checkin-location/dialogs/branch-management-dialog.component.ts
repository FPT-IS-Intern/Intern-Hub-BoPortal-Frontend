import { Component, inject, OnInit, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BranchCheckinConfig } from '@/models/checkin-config.model';
import { CheckinConfigService } from '@/services/api/checkin-config.service';
import { ToastService } from '@/services/common/toast.service';
import { SharedSearchComponent } from '@/components/shared-search/shared-search.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ModalPopup } from '@/components/popups/modal-popup/modal-popup';
import { ConfirmPopup } from '@/components/popups/confirm-popup/confirm-popup';

@Component({
  selector: 'app-branch-management-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    SharedSearchComponent,
    TranslateModule,
    ModalPopup,
    ConfirmPopup
  ],
  templateUrl: './branch-management-dialog.component.html',
  styleUrl: './branch-management-dialog.component.scss'
})
export class BranchManagementDialogComponent implements OnInit {
  private readonly checkinService = inject(CheckinConfigService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  
  @Input() isVisible = false;
  @Input() data: { branches: BranchCheckinConfig[] } | null = null;
  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<boolean>();

  protected readonly isDeleteConfirmVisible = signal(false);
  protected branchToDelete = signal<BranchCheckinConfig | null>(null);
  
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
    if (this.data?.branches) {
      this.branches.set([...this.data.branches]);
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
        this.close.emit(true);
      },
      error: () => {
        this.toast.error(this.translate.instant('checkin.branchDialog.toast.saveError'));
        this.isSaving = false;
      }
    });
  }

  onDelete(branch: BranchCheckinConfig) {
    this.branchToDelete.set(branch);
    this.isDeleteConfirmVisible.set(true);
  }

  handleDeleteConfirm() {
    const branch = this.branchToDelete();
    if (!branch) return;

    this.isDeleteConfirmVisible.set(false);
    this.checkinService.deleteBranch(branch.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('checkin.branchDialog.toast.deleteSuccess'));
        this.close.emit(true);
      },
      error: () => this.toast.error(this.translate.instant('checkin.branchDialog.toast.deleteError'))
    });
  }

  handleCancel() {
    this.isVisible = false;
    this.isVisibleChange.emit(this.isVisible);
    this.close.emit(false);
  }
}


