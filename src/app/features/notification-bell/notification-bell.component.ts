import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../services/toast.service';
import { NotificationTableComponent } from './notification-table/notification-table.component';
import { NotificationPaginationComponent } from './notification-pagination/notification-pagination.component';
import { NotificationFormComponent } from './notification-form/notification-form.component';
import { ModalPopup } from '../../components/popups/modal-popup/modal-popup';
import { ConfirmPopup } from '../../components/popups/confirm-popup/confirm-popup';
import { NotificationRecord } from '../../models/notification.model';
import { SharedSearchComponent } from '../../components/shared-search/shared-search.component';
import { SharedDateRangeComponent, DateRange } from '../../components/shared-date-range/shared-date-range.component';
import { SharedDropdownComponent } from '../../components/shared-dropdown/shared-dropdown.component';
import { NoDataComponent } from '../../components/no-data/no-data.component';
import { NOTIFICATION_MOCKS, NOTIFICATION_STATUS_OPTIONS } from '../../core/mocks/notification.mock';
import { signal } from '@angular/core';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NotificationTableComponent,
    NotificationPaginationComponent,
    NotificationFormComponent,
    SharedSearchComponent,
    SharedDateRangeComponent,
    SharedDropdownComponent,
    NoDataComponent,
    TranslateModule,
    ModalPopup,
    ConfirmPopup,
  ],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Status options from Centralized Mocks
  protected statusOptions = NOTIFICATION_STATUS_OPTIONS;

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Home', icon: 'custom-icon-home', url: '/main' },
      { label: this.translate.instant('permissionMatrix.breadcrumb.systemConfig') },
      { label: this.translate.instant('notification.bell.breadcrumb.title'), active: true }
    ]);
  }

  // State
  protected pageIndex = 1;
  protected pageSize = 10;
  protected pageSizeOptions = [10, 20, 50];

  // Filters
  protected searchText = '';
  protected statusFilter: string = '';
  protected dateRange: DateRange = { from: null, to: null };

  // New states for better UX
  protected readonly isLoading = signal(false);
  protected readonly isError = signal(false);

  protected readonly allNotifications: NotificationRecord[] = [...NOTIFICATION_MOCKS];

  protected setStatusFilter(value: string | null): void {
    this.statusFilter = value ?? '';
    this.pageIndex = 1;
  }

  protected get filteredNotifications(): NotificationRecord[] {
    return this.allNotifications.filter(item => {
      const matchSearch = item.title.toLowerCase().includes(this.searchText.toLowerCase());
      const matchStatus = this.statusFilter ? item.status === this.statusFilter : true;

      let matchDate = true;
      const createdDate = item.createdAt.split('T')[0]; // Get YYYY-MM-DD
      if (this.dateRange.from && createdDate < this.dateRange.from) matchDate = false;
      if (this.dateRange.to && createdDate > this.dateRange.to) matchDate = false;

      return matchSearch && matchStatus && matchDate;
    });
  }

  protected get total(): number {
    return this.filteredNotifications.length;
  }

  protected get listOfData(): NotificationRecord[] {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    return this.filteredNotifications.slice(startIndex, startIndex + this.pageSize);
  }

  // Form Modal State
  protected isModalVisible = false;
  protected isReadOnly = false;
  protected modalTitleKey = '';
  protected selectedRecord: NotificationRecord | null = null;

  // Confirm State
  protected isConfirmVisible = false;
  protected confirmTitleKey = '';
  protected confirmMessageKey = '';
  protected confirmMessageParams: any = {};
  protected confirmAction: () => void = () => { };

  protected get displayRange(): string {
    if (this.total === 0) return '0-0';
    const start = (this.pageIndex - 1) * this.pageSize + 1;
    const end = Math.min(this.pageIndex * this.pageSize, this.total);
    return `${start}-${end}`;
  }

  protected onAddNew(): void {
    this.selectedRecord = null;
    this.isReadOnly = false;
    this.modalTitleKey = 'notification.bell.modals.create';
    this.isModalVisible = true;
  }

  protected onView(record: NotificationRecord): void {
    this.selectedRecord = record;
    this.isReadOnly = true;
    this.modalTitleKey = 'notification.bell.modals.detail';
    this.isModalVisible = true;
  }

  protected onEdit(record: NotificationRecord): void {
    this.selectedRecord = record;
    this.isReadOnly = false;
    this.modalTitleKey = 'notification.bell.modals.edit';
    this.isModalVisible = true;
  }

  protected onDelete(record: NotificationRecord): void {
    this.confirmTitleKey = 'notification.bell.modals.deleteTitle';
    this.confirmMessageKey = 'notification.bell.modals.deleteMessage';
    this.confirmMessageParams = { title: record.title };
    this.confirmAction = () => {
      const idx = this.allNotifications.findIndex(n => n.id === record.id);
      if (idx > -1) {
        this.allNotifications.splice(idx, 1);
        this.toast.successKey('notification.bell.toast.deleteSuccess');
      }
      this.isConfirmVisible = false;
    };
    this.isConfirmVisible = true;
  }

  protected onSendNow(record: NotificationRecord): void {
    this.confirmTitleKey = 'notification.bell.modals.sendNowTitle';
    this.confirmMessageKey = 'notification.bell.modals.sendNowMessage';
    this.confirmMessageParams = { title: record.title };
    this.confirmAction = () => {
      const idx = this.allNotifications.findIndex(n => n.id === record.id);
      if (idx > -1) {
        this.allNotifications[idx].status = 'Sent';
        this.allNotifications[idx].sentAt = new Date().toISOString();
        this.toast.successKey('notification.bell.toast.sendSuccess');
      }
      this.isConfirmVisible = false;
    };
    this.isConfirmVisible = true;
  }

  protected handleSaveForm(data: Partial<NotificationRecord>): void {
    if (this.selectedRecord) {
      const idx = this.allNotifications.findIndex(n => n.id === this.selectedRecord?.id);
      if (idx > -1) {
        this.allNotifications[idx] = { ...this.allNotifications[idx], ...data } as NotificationRecord;
        this.toast.successKey('notification.bell.toast.updateSuccess');
      }
    } else {
      const newId = Math.max(...this.allNotifications.map(n => n.id), 0) + 1;
      const newRecord: NotificationRecord = {
        id: newId,
        createdAt: new Date().toISOString(),
        status: data.scheduleTime ? 'Scheduled' : 'Draft',
        ...data
      } as NotificationRecord;
      this.allNotifications.unshift(newRecord);
      this.toast.successKey('notification.bell.toast.createSuccess');
    }
    this.isModalVisible = false;
  }

  protected onPageIndexChange(index: number): void {
    this.pageIndex = index;
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
  }

  protected onSearchChange(): void {
    this.pageIndex = 1;
    this.cdr.markForCheck();
  }
}