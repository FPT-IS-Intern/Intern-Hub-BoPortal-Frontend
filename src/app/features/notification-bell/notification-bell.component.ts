import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbService } from '../../services/common/breadcrumb.service';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../services/common/toast.service';
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
import { NotificationService } from '../../services/api/notification.service';
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
  private readonly notificationService = inject(NotificationService);

  // Status options from Centralized Mocks
  protected statusOptions = NOTIFICATION_STATUS_OPTIONS;

  ngOnInit(): void {
    this.translate.stream('notification.bell.breadcrumb.title').subscribe(label => {
      this.breadcrumbService.setBreadcrumbs([
        { label: 'Home', icon: 'custom-icon-home', url: '/main' },
        { label, active: true }
      ]);
    });
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.isError.set(false);
    this.notificationService.getNotifications().subscribe({
      next: (res: any) => {
        if (res.data) {
          this.allNotifications.set(res.data);
        }
        
      },
      error: () => {
        this.isError.set(true);
      }
    });
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
  protected readonly isError = signal(false);

  protected readonly allNotifications = signal<NotificationRecord[]>([]);

  protected setStatusFilter(value: string | null): void {
    this.statusFilter = value ?? '';
    this.pageIndex = 1;
  }

  protected get filteredNotifications(): NotificationRecord[] {
    return this.allNotifications().filter(item => {
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
      if (!record.id) return;
      this.notificationService.deleteNotification(record.id).subscribe({
        next: () => {
          this.allNotifications.update(list => list.filter(n => n.id !== record.id));
          this.toast.successKey('notification.bell.toast.deleteSuccess');
          this.isConfirmVisible = false;
        },
        error: () => {
          this.toast.errorKey('notification.bell.toast.deleteError');
          this.isConfirmVisible = false;
        }
      });
    };
    this.isConfirmVisible = true;
  }

  protected onSendNow(record: NotificationRecord): void {
    this.confirmTitleKey = 'notification.bell.modals.sendNowTitle';
    this.confirmMessageKey = 'notification.bell.modals.sendNowMessage';
    this.confirmMessageParams = { title: record.title };
    this.confirmAction = () => {
      if (!record.id) return;
      this.notificationService.sendNow(record.id).subscribe({
        next: () => {
          this.loadNotifications(); // Refresh list to get updated status/times
          this.toast.successKey('notification.bell.toast.sendSuccess');
          this.isConfirmVisible = false;
        },
        error: () => {
          this.toast.errorKey('notification.bell.toast.sendError');
          this.isConfirmVisible = false;
        }
      });
    };
    this.isConfirmVisible = true;
  }

  protected handleSaveForm(data: Partial<NotificationRecord>): void {
    if (this.selectedRecord) {
      if (!this.selectedRecord.id) return;
      this.notificationService.updateNotification(this.selectedRecord.id, data).subscribe({
        next: () => {
          this.loadNotifications();
          this.toast.successKey('notification.bell.toast.updateSuccess');
          this.isModalVisible = false;
        }
      });
    } else {
      this.notificationService.createNotification(data).subscribe({
        next: () => {
          this.loadNotifications();
          this.toast.successKey('notification.bell.toast.createSuccess');
          this.isModalVisible = false;
        }
      });
    }
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
