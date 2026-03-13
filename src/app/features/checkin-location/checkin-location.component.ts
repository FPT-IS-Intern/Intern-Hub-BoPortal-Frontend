import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

import { NoDataComponent } from '../../components/no-data/no-data.component';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { CheckinConfigService } from '../../services/checkin-config.service';
import { ToastService } from '../../services/toast.service';
import { BranchCheckinConfig, IPRange, AttendanceLocation } from '../../models/checkin-config.model';
import { UpsertLocationDialogComponent } from './dialogs/upsert-location-dialog.component';
import { UpsertIPRangeDialogComponent } from './dialogs/upsert-ip-range-dialog.component';
import { BranchManagementDialogComponent } from './dialogs/branch-management-dialog.component';
import { BranchSidebarComponent } from './components/branch-sidebar/branch-sidebar.component';
import { LocationTabComponent } from './components/location-tab/location-tab.component';
import { IpTabComponent } from './components/ip-tab/ip-tab.component';

@Component({
  selector: 'app-checkin-location',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NoDataComponent,
    NzInputModule,
    NzIconModule,
    NzButtonModule,
    NzModalModule,
    TranslateModule,
    BranchSidebarComponent,
    LocationTabComponent,
    IpTabComponent
  ],
  templateUrl: './checkin-location.component.html',
  styleUrl: './checkin-location.component.scss'
})
export class CheckinLocationComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly checkinService = inject(CheckinConfigService);
  private readonly modal = inject(NzModalService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  // State Signals
  protected readonly branches = signal<BranchCheckinConfig[]>([]);
  protected readonly selectedBranch = signal<BranchCheckinConfig | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isError = signal(false);
  protected readonly activeTabIndex = signal(0);

  ngOnInit(): void {
    this.updateBreadcrumbs();
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateBreadcrumbs();
    });
    this.fetchConfigs();
  }

  protected fetchConfigs(): void {
    this.isLoading.set(true);
    this.isError.set(false);

    this.checkinService.getCheckinConfigs().subscribe({
      next: (res) => {
        const freshData = res.data || [];
        this.branches.set(freshData);

        // Always re-sync selectedBranch with fresh data so UI reflects updates
        if (freshData.length > 0) {
          const currentId = this.selectedBranch()?.id;
          const refreshed = currentId
            ? freshData.find(b => b.id === currentId) ?? freshData[0]
            : freshData[0];
          this.selectedBranch.set(refreshed);
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Fetch checkin configs error:', err);
        this.isError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  protected selectBranch(branch: BranchCheckinConfig): void {
    // Create a new reference so dependent views update reliably
    this.selectedBranch.set({ ...branch });
    this.activeTabIndex.set(0);
  }

  protected onTabChange(index: number): void {
    this.activeTabIndex.set(index);
  }

  // --- CRUD Implementation ---

  protected openLocationModal(location?: AttendanceLocation): void {
    const branch = this.selectedBranch();
    if (!branch) return;

    const modalRef = this.modal.create({
      nzTitle: location
        ? this.translate.instant('checkin.locationDialog.title.edit')
        : this.translate.instant('checkin.locationDialog.title.create'),
      nzContent: UpsertLocationDialogComponent,
      nzData: location,
      nzFooter: null,
      nzWidth: 900
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        const isEdit = !!result.id;
        const payload = { ...result, branchId: branch.id };
        const request$ = isEdit
          ? this.checkinService.updateLocation(result.id, payload)
          : this.checkinService.createLocation(payload);

        request$.subscribe({
          next: () => {
            this.toast.success(
              isEdit
                ? this.translate.instant('checkin.location.toast.updateSuccess')
                : this.translate.instant('checkin.location.toast.createSuccess')
            );
            this.fetchConfigs();
          },
          error: () => this.toast.error(this.translate.instant('checkin.location.toast.saveError'))
        });
      }
    });
  }

  protected confirmDeleteLocation(location: AttendanceLocation): void {
    this.modal.confirm({
      nzTitle: this.translate.instant('checkin.location.confirmDelete.title'),
      nzContent: this.translate.instant('checkin.location.confirmDelete.message', { name: location.name }),
      nzOkText: this.translate.instant('checkin.common.actions.delete'),
      nzOkDanger: true,
      nzOnOk: () => {
        this.checkinService.deleteLocation(location.id).subscribe({
          next: () => {
            this.toast.success(this.translate.instant('checkin.location.toast.deleteSuccess'));
            this.fetchConfigs();
          },
          error: () => this.toast.error(this.translate.instant('checkin.location.toast.deleteError'))
        });
      }
    });
  }

  protected openIPModal(range?: IPRange): void {
    const branch = this.selectedBranch();
    if (!branch) return;

    const modalRef = this.modal.create({
      nzTitle: range
        ? this.translate.instant('checkin.ipDialog.title.edit')
        : this.translate.instant('checkin.ipDialog.title.create'),
      nzContent: UpsertIPRangeDialogComponent,
      nzData: range,
      nzFooter: null,
      nzWidth: 500
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        const isEdit = !!result.id;
        const payload = { ...result, branchId: branch.id };
        const request$ = isEdit
          ? this.checkinService.updateIPRange(result.id, payload)
          : this.checkinService.createIPRange(payload);

        request$.subscribe({
          next: () => {
            this.toast.success(
              isEdit
                ? this.translate.instant('checkin.ip.toast.updateSuccess')
                : this.translate.instant('checkin.ip.toast.createSuccess')
            );
            this.fetchConfigs();
          },
          error: () => this.toast.error(this.translate.instant('checkin.ip.toast.saveError'))
        });
      }
    });
  }

  protected confirmDeleteIP(range: IPRange): void {
    this.modal.confirm({
      nzTitle: this.translate.instant('checkin.ip.confirmDelete.title'),
      nzContent: this.translate.instant('checkin.ip.confirmDelete.message', { name: range.name }),
      nzOkText: this.translate.instant('checkin.common.actions.delete'),
      nzOkDanger: true,
      nzOnOk: () => {
        this.checkinService.deleteIPRange(range.id).subscribe({
          next: () => {
            this.toast.success(this.translate.instant('checkin.ip.toast.deleteSuccess'));
            this.fetchConfigs();
          },
          error: () => this.toast.error(this.translate.instant('checkin.ip.toast.deleteError'))
        });
      }
    });
  }

  // --- Branch Management ---

  protected onManageBranches(): void {
    const modalRef = this.modal.create({
      nzTitle: this.translate.instant('checkin.branchDialog.title'),
      nzContent: BranchManagementDialogComponent,
      nzData: { branches: this.branches() },
      nzFooter: null,
      nzWidth: 800
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.fetchConfigs();
      }
    });
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('checkin.breadcrumb.home'), icon: 'custom-icon-home', url: '/main' },
      { label: this.translate.instant('checkin.breadcrumb.title'), active: true }
    ]);
  }
}
