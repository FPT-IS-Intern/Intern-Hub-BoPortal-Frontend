import { Component, OnInit, inject, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { NoDataComponent } from '../../components/no-data/no-data.component';
import { BreadcrumbService } from '../../services/common/breadcrumb.service';
import { CheckinConfigService } from '../../services/api/checkin-config.service';
import { ToastService } from '../../services/common/toast.service';
import { BranchCheckinConfig, IPRange, AttendanceLocation } from '../../models/checkin-config.model';
import { UpsertLocationDialogComponent } from './dialogs/upsert-location-dialog.component';
import { UpsertIPRangeDialogComponent } from './dialogs/upsert-ip-range-dialog.component';
import { BranchManagementDialogComponent } from './dialogs/branch-management-dialog.component';
import { BranchSidebarComponent } from './components/branch-sidebar/branch-sidebar.component';
import { LocationTabComponent } from './components/location-tab/location-tab.component';
import { IpTabComponent } from './components/ip-tab/ip-tab.component';
import { ConfirmPopup } from '../../components/popups/confirm-popup/confirm-popup';

@Component({
  selector: 'app-checkin-location',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NoDataComponent,
    TranslateModule,
    BranchSidebarComponent,
    LocationTabComponent,
    IpTabComponent,
    UpsertLocationDialogComponent,
    UpsertIPRangeDialogComponent,
    BranchManagementDialogComponent,
    ConfirmPopup
  ],
  templateUrl: './checkin-location.component.html',
  styleUrl: './checkin-location.component.scss'
})
export class CheckinLocationComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly checkinService = inject(CheckinConfigService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // State Signals
  protected readonly branches = signal<BranchCheckinConfig[]>([]);
  protected readonly selectedBranch = signal<BranchCheckinConfig | null>(null);
  protected readonly isError = signal(false);
  protected readonly activeTabIndex = signal(0);

  // Dialog State Signals
  protected readonly isLocationModalVisible = signal(false);
  protected readonly selectedLocation = signal<AttendanceLocation | null>(null);
  protected readonly isIPModalVisible = signal(false);
  protected readonly selectedIPRange = signal<IPRange | null>(null);
  protected readonly isBranchManagementVisible = signal(false);

  // Delete Confirm State
  protected readonly isDeleteConfirmVisible = signal(false);
  protected deleteConfirmData = signal<{ type: 'location' | 'ip'; data: any } | null>(null);

  ngOnInit(): void {
    this.updateBreadcrumbs();
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateBreadcrumbs();
    });
    this.fetchConfigs();
  }

  protected fetchConfigs(): void {
    this.isError.set(false);

    this.checkinService.getCheckinConfigs().subscribe({
      next: (res) => {
        const freshData = res.data || [];
        this.branches.set(freshData);

        // Always re-sync selectedBranch with fresh data so UI reflects updates
        if (freshData.length > 0) {
          const currentId = this.selectedBranch()?.id;
          const refreshed = currentId
            ? freshData.find((b: any) => b.id === currentId) ?? freshData[0]
            : freshData[0];
          this.selectedBranch.set(refreshed);
        }

        
      },
      error: (err) => {
        console.error('Fetch checkin configs error:', err);
        this.isError.set(true);
        
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
    if (!location && (branch.attendanceLocations?.length ?? 0) >= 1) return;

    this.selectedLocation.set(location || null);
    this.isLocationModalVisible.set(true);
    this.cdr.markForCheck();
  }

  protected handleLocationSave(result: any): void {
    const branch = this.selectedBranch();
    if (!branch) return;

    this.isLocationModalVisible.set(false);
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

  protected confirmDeleteLocation(location: AttendanceLocation): void {
    this.deleteConfirmData.set({ type: 'location', data: location });
    this.isDeleteConfirmVisible.set(true);
    this.cdr.markForCheck();
  }

  protected handleLocationDelete(): void {
    const data = this.deleteConfirmData()?.data;
    if (!data) return;

    this.isDeleteConfirmVisible.set(false);
    this.checkinService.deleteLocation(data.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('checkin.location.toast.deleteSuccess'));
        this.fetchConfigs();
      },
      error: () => this.toast.error(this.translate.instant('checkin.location.toast.deleteError'))
    });
  }

  protected openIPModal(range?: IPRange): void {
    const branch = this.selectedBranch();
    if (!branch) return;

    this.selectedIPRange.set(range || null);
    this.isIPModalVisible.set(true);
    this.cdr.markForCheck();
  }

  protected handleIPSave(result: any): void {
    const branch = this.selectedBranch();
    if (!branch) return;

    this.isIPModalVisible.set(false);
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

  protected confirmDeleteIP(range: IPRange): void {
    this.deleteConfirmData.set({ type: 'ip', data: range });
    this.isDeleteConfirmVisible.set(true);
    this.cdr.markForCheck();
  }

  protected handleIPDelete(): void {
    const data = this.deleteConfirmData()?.data;
    if (!data) return;

    this.isDeleteConfirmVisible.set(false);
    this.checkinService.deleteIPRange(data.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('checkin.ip.toast.deleteSuccess'));
        this.fetchConfigs();
      },
      error: () => this.toast.error(this.translate.instant('checkin.ip.toast.deleteError'))
    });
  }

  protected onConfirmDelete(): void {
    const config = this.deleteConfirmData();
    if (!config) return;

    if (config.type === 'location') {
      this.handleLocationDelete();
    } else {
      this.handleIPDelete();
    }
  }

  // --- Branch Management ---

  protected onManageBranches(): void {
    this.isBranchManagementVisible.set(true);
    this.cdr.markForCheck();
  }

  protected handleBranchManagementClose(refresh: boolean): void {
    this.isBranchManagementVisible.set(false);
    if (refresh) {
      this.fetchConfigs();
    }
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('checkin.breadcrumb.home'), icon: 'custom-icon-home', url: '/main' },
      { label: this.translate.instant('checkin.breadcrumb.title'), active: true }
    ]);
  }
}
