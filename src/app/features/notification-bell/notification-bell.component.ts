import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';
import { NotificationTableComponent } from './notification-table/notification-table.component';
import { NotificationPaginationComponent } from './notification-pagination/notification-pagination.component';
import { ModalPopup } from '../../components/modal-popup/modal-popup';

export interface NotificationRecord {
  id: string;
  code: string;
  content: string;
}

const NOTIFICATION_TEMPLATES: Array<Pick<NotificationRecord, 'code' | 'content'>> = [
  {
    code: 'REMOTE_ONSITE_PENDING',
    content: 'Yeu cau dang ky Remote/Onsite da duoc gui va dang cho phe duyet.',
  },
  {
    code: 'REMOTE_ONSITE_APPROVED',
    content: 'Yeu cau Remote/Onsite da duoc phe duyet. Vui long kiem tra lich lam viec.',
  },
  {
    code: 'REMOTE_ONSITE_REJECTED',
    content: 'Yeu cau Remote/Onsite da bi tu choi. Vui long xem ly do de cap nhat.',
  },
  {
    code: 'USER_FEEDBACK',
    content: 'Phan hoi cua ban da duoc ghi nhan. He thong se xu ly trong thoi gian som nhat.',
  },
  {
    code: 'REMIND_PASSWORD',
    content: 'Mat khau sap het han. Vui long doi mat khau de tranh gian doan dang nhap.',
  },
  {
    code: 'ANNOUNCEMENT',
    content: 'He thong se bao tri dinh ky vao cuoi tuan. Vui long sap xep cong viec phu hop.',
  },
];

function createMockNotifications(total: number): NotificationRecord[] {
  return Array.from({ length: total }, (_, index) => {
    const template = NOTIFICATION_TEMPLATES[index % NOTIFICATION_TEMPLATES.length];
    const id = index + 1;

    return {
      id: String(id),
      code: template.code,
      content: `${template.content} (Mock #${id})`,
    };
  });
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzBreadCrumbModule,
    NzButtonModule,
    NzIconModule,
    NotificationTableComponent,
    NotificationPaginationComponent,
    ModalPopup,
  ],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent {
  protected pageIndex = 1;
  protected pageSize = 10;
  protected readonly allNotifications: NotificationRecord[] = createMockNotifications(200);
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
    console.log('Apply notification config');
  }
}