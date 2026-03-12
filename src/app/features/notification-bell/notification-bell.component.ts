import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';
import { NotificationTableComponent } from './notification-table/notification-table.component';
import { NotificationPaginationComponent } from './notification-pagination/notification-pagination.component';
import { ModalPopup } from '../../components/popups/modal-popup/modal-popup';
import { ConfirmPopup } from '../../components/popups/confirm-popup/confirm-popup';

import { NotificationRecord } from '../../models/notification.model';
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NotificationTableComponent,
    NotificationPaginationComponent,
    ModalPopup,
    ConfirmPopup,
  ],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Home', icon: 'custom-icon-home', url: '/main' },
      { label: 'Cấu Hình Hệ Thống' },
      { label: 'Chuông Thông Báo', active: true }
    ]);
  }

  protected pageIndex = 1;
  protected pageSize = 10;
  protected readonly allNotifications: NotificationRecord[] = [];
  protected total = this.allNotifications.length;
  protected pageSizeOptions = [10, 20, 50];

  protected get listOfData(): NotificationRecord[] {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    return this.allNotifications.slice(startIndex, startIndex + this.pageSize);
  }

  // State cho Modal Popup
  protected isModalVisible = false;
  protected selectedRecord: NotificationRecord | null = null;
  protected editContent = '';

  // State cho Confirm Popup
  protected isConfirmVisible = false;

  protected get displayRange(): string {
    if (this.total === 0) {
      return '0-0';
    }

    const start = (this.pageIndex - 1) * this.pageSize + 1;
    const end = Math.min(this.pageIndex * this.pageSize, this.total);
    return `${start}-${end}`;
  }

  protected onEdit(record: NotificationRecord): void {
    this.selectedRecord = { ...record };
    this.editContent = record.content;
    this.isModalVisible = true;
  }

  protected handleModalSave(): void {
    if (this.selectedRecord) {
      // Cập nhật lại list gốc (trong thực tế sẽ gọi API lưu)
      const index = this.allNotifications.findIndex((n) => n.id === this.selectedRecord?.id);
      if (index !== -1) {
        this.allNotifications[index].content = this.editContent;
      }
      this.isModalVisible = false;
      this.selectedRecord = null;
    }
  }

  protected handleModalCancel(): void {
    this.isModalVisible = false;
    this.selectedRecord = null;
  }

  protected onTextareaFocus(event: FocusEvent): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.borderColor = '#f97316';
  }

  protected onApproveAll(): void {
    console.log('Duyet tat ca');
  }

  protected onPageIndexChange(index: number): void {
    this.pageIndex = index;
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
  }

  protected onSubmit(): void {
    this.isConfirmVisible = true;
  }

  protected handleConfirmSave(): void {
    console.log('Confirmed Save. Calling API...');
    this.isConfirmVisible = false;
  }

  protected handleConfirmCancel(): void {
    this.isConfirmVisible = false;
  }
}