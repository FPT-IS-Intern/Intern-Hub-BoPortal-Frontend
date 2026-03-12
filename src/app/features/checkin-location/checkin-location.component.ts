import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
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

@Component({
  selector: 'app-checkin-location',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    NzTabsModule,
    NzInputModule,
    NzIconModule,
    NzButtonModule,
    NzModalModule,
    NoDataComponent
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
  protected readonly searchQuery = signal('');
  protected activeTabIndex = 0;

  // Computed
  protected readonly filteredBranches = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.branches();
    return this.branches().filter(b => 
      b.name.toLowerCase().includes(query) || 
      b.description?.toLowerCase().includes(query)
    );
  });

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
        this.branches.set(res.data || []);
        if (res.data && res.data.length > 0 && !this.selectedBranch()) {
          this.selectedBranch.set(res.data[0]);
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
    this.activeTabIndex = index;
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
        this.checkinService.upsertLocation(branch.id, result).subscribe({
          next: () => {
            this.toast.success(location ? 'Cập nhật vị trí thành công' : 'Thêm vị trí mới thành công');
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
        this.checkinService.upsertIPRange(branch.id, result).subscribe({
          next: () => {
            this.toast.success(range ? 'Cập nhật dải IP thành công' : 'Thêm dải IP mới thành công');
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
