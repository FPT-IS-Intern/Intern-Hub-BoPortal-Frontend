import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { NoDataComponent } from '../../components/no-data/no-data.component';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { CheckinConfigService } from '../../services/checkin-config.service';
import { ToastService } from '../../services/toast.service';
import { BranchCheckinConfig, IPRange, AttendanceLocation } from '../../models/checkin-config.model';
import { UpsertLocationDialogComponent } from './dialogs/upsert-location-dialog.component';
import { UpsertIPRangeDialogComponent } from './dialogs/upsert-ip-range-dialog.component';
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

  // State Signals
  protected readonly branches = signal<BranchCheckinConfig[]>([]);
  protected readonly selectedBranch = signal<BranchCheckinConfig | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isError = signal(false);
  protected readonly activeTabIndex = signal(0);

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Home', icon: 'custom-icon-home', url: '/main' },
      { label: 'Địa điểm checkin', active: true }
    ]);
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
    this.selectedBranch.set(branch);
  }

  protected onTabChange(index: number): void {
    this.activeTabIndex.set(index);
  }

  // --- CRUD Implementation ---

  protected openLocationModal(location?: AttendanceLocation): void {
    const branch = this.selectedBranch();
    if (!branch) return;

    const modalRef = this.modal.create({
      nzTitle: location ? 'Chỉnh sửa vị trí check-in' : 'Thêm vị trí check-in mới',
      nzContent: UpsertLocationDialogComponent,
      nzData: location,
      nzFooter: null,
      nzWidth: 500
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
            this.toast.success(isEdit ? 'Cập nhật vị trí thành công' : 'Thêm vị trí mới thành công');
            this.fetchConfigs();
          },
          error: () => this.toast.error('Có lỗi xảy ra khi lưu vị trí')
        });
      }
    });
  }

  protected confirmDeleteLocation(location: AttendanceLocation): void {
    this.modal.confirm({
      nzTitle: 'Xóa vị trí check-in?',
      nzContent: `Bạn có chắc chắn muốn xóa vị trí <b>${location.name}</b>?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.checkinService.deleteLocation(location.id).subscribe({
          next: () => {
            this.toast.success('Đã xóa vị trí check-in');
            this.fetchConfigs();
          },
          error: () => this.toast.error('Không thể xóa vị trí này')
        });
      }
    });
  }

  protected openIPModal(range?: IPRange): void {
    const branch = this.selectedBranch();
    if (!branch) return;

    const modalRef = this.modal.create({
      nzTitle: range ? 'Chỉnh sửa dải IP' : 'Thêm dải IP Wifi mới',
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
            this.toast.success(isEdit ? 'Cập nhật dải IP thành công' : 'Thêm dải IP mới thành công');
            this.fetchConfigs();
          },
          error: () => this.toast.error('Có lỗi xảy ra khi lưu dải IP')
        });
      }
    });
  }

  protected confirmDeleteIP(range: IPRange): void {
    this.modal.confirm({
      nzTitle: 'Xóa dải IP?',
      nzContent: `Bạn có chắc chắn muốn xóa dải IP <b>${range.name}</b>?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.checkinService.deleteIPRange(range.id).subscribe({
          next: () => {
            this.toast.success('Đã xóa dải IP');
            this.fetchConfigs();
          },
          error: () => this.toast.error('Không thể xóa dải IP này')
        });
      }
    });
  }
}
