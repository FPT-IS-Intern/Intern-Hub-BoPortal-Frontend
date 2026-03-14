import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormsModule } from '@angular/forms';
import { NotificationTableComponent } from './notification-table/notification-table.component';
import { NotificationPaginationComponent } from './notification-pagination/notification-pagination.component';
import { NotificationFormComponent } from './notification-form/notification-form.component';
import { ModalPopup } from '../../components/popups/modal-popup/modal-popup';
import { ConfirmPopup } from '../../components/popups/confirm-popup/confirm-popup';
import { NotificationRecord } from '../../models/notification.model';
import { SharedSearchComponent } from '../../components/shared-search/shared-search.component';
import { SharedDateRangeComponent, DateRange } from '../../components/shared-date-range/shared-date-range.component';
import { SharedDropdownComponent } from '../../components/shared-dropdown/shared-dropdown.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NotificationTableComponent,
    NotificationPaginationComponent,
    NotificationFormComponent,
    SharedSearchComponent,
    SharedDateRangeComponent,
    SharedDropdownComponent,
    ModalPopup,
    ConfirmPopup,
  ],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly message = inject(NzMessageService);

  // Status options for Custom Dropdown
  protected statusOptions = [
    { label: 'Tất cả trạng thái', value: null },
    { label: 'Đã gửi', value: 'Sent' },
    { label: 'Nháp', value: 'Draft' },
    { label: 'Đã lên lịch', value: 'Scheduled' }
  ];

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Home', icon: 'custom-icon-home', url: '/main' },
      { label: 'Cấu Hình Hệ Thống' },
      { label: 'Chuông Thông Báo', active: true }
    ]);
  }

  // State
  protected pageIndex = 1;
  protected pageSize = 10;
  protected pageSizeOptions = [10, 20, 50];

  // Filters
  protected searchText = '';
  protected statusFilter: string | null = null;
  protected dateRange: DateRange = { from: null, to: null };

  protected readonly allNotifications: NotificationRecord[] = [
    { id: 1, title: 'Thông báo bảo trì hệ thống', content: 'Hệ thống sẽ bảo trì vào lúc 24h ngày 15/03/2026', audience: 'All', status: 'Sent', type: 'System', createdAt: '2026-03-14T10:00:00Z', sentAt: '2026-03-14T10:00:00Z' },
    { id: 2, title: 'Khuyến mãi tháng 3', content: 'Nhận ngay voucher 50% cho các dịch vụ mới', audience: 'Group', status: 'Draft', type: 'Promotion', createdAt: '2026-03-14T11:30:00Z' },
    { id: 3, title: 'Cảnh báo đăng nhập lạ', content: 'Phát hiện đăng nhập từ khu vực bất thường', audience: 'Specific', status: 'Scheduled', type: 'Warning', createdAt: '2026-03-14T14:45:00Z', scheduleTime: '2026-03-15T08:00:00Z' },
    { id: 4, title: 'Cập nhật chính sách bảo mật', content: 'Chúng tôi vừa cập nhật một số điều khoản mới', audience: 'All', status: 'Sent', type: 'System', createdAt: '2026-03-12T09:00:00Z', sentAt: '2026-03-12T09:05:00Z' },
  ];

  protected setStatusFilter(value: string | null): void {
    this.statusFilter = value;
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
  protected modalTitle = 'Thêm mới thông báo';
  protected selectedRecord: NotificationRecord | null = null;

  // Confirm State
  protected isConfirmVisible = false;
  protected confirmTitle = '';
  protected confirmMessage = '';
  protected confirmAction: () => void = () => {};

  protected get displayRange(): string {
    if (this.total === 0) return '0-0';
    const start = (this.pageIndex - 1) * this.pageSize + 1;
    const end = Math.min(this.pageIndex * this.pageSize, this.total);
    return `${start}-${end}`;
  }

  protected onAddNew(): void {
    this.selectedRecord = null;
    this.isReadOnly = false;
    this.modalTitle = 'Tạo thông báo mới';
    this.isModalVisible = true;
  }

  protected onView(record: NotificationRecord): void {
    this.selectedRecord = record;
    this.isReadOnly = true;
    this.modalTitle = 'Chi tiết thông báo';
    this.isModalVisible = true;
  }

  protected onEdit(record: NotificationRecord): void {
    this.selectedRecord = record;
    this.isReadOnly = false;
    this.modalTitle = 'Chỉnh sửa thông báo';
    this.isModalVisible = true;
  }

  protected onDelete(record: NotificationRecord): void {
    this.confirmTitle = 'Xóa thông báo';
    this.confirmMessage = `Bạn có chắc chắn muốn xóa thông báo "${record.title}"?`;
    this.confirmAction = () => {
      const idx = this.allNotifications.findIndex(n => n.id === record.id);
      if (idx > -1) {
        this.allNotifications.splice(idx, 1);
        this.message.success('Đã xóa thông báo thành công');
      }
      this.isConfirmVisible = false;
    };
    this.isConfirmVisible = true;
  }

  protected onSendNow(record: NotificationRecord): void {
    this.confirmTitle = 'Gửi thông báo ngay';
    this.confirmMessage = `Gửi thông báo "${record.title}" đến toàn bộ đối tượng đã chọn ngay lập tức?`;
    this.confirmAction = () => {
      const idx = this.allNotifications.findIndex(n => n.id === record.id);
      if (idx > -1) {
        this.allNotifications[idx].status = 'Sent';
        this.allNotifications[idx].sentAt = new Date().toISOString();
        this.message.success('Đã gửi thông báo thành công');
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
        this.message.success('Đã cập nhật thông báo thành công');
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
      this.message.success('Đã tạo thông báo thành công');
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
  }
}