import { Component, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';
import { NotificationTableComponent } from './notification-table/notification-table.component';
import { NotificationPaginationComponent } from './notification-pagination/notification-pagination.component';

export interface NotificationRecord {
  id: string;
  code: string;
  content: string;
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
  ],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  protected pageIndex = 1;
  protected pageSize = 10;
  protected total = 200;
  protected pageSizeOptions = [10, 20, 50];
  protected readonly listOfData: NotificationRecord[] = [
    {
      id: '1',
      code: 'REMOTE_ONSITE_PENDING',
      content:
        'Yêu cầu đăng ký làm việc Remote/Onsite của bạn đã được gửi thành công và đang chờ phê duyệt.',
    },
    {
      id: '2',
      code: 'REMOTE_ONSITE_PENDING',
      content:
        'Yêu cầu đăng ký làm việc Remote/Onsite của bạn đã được phê duyệt. Vui lòng kiểm tra lịch làm việc để biết thêm chi tiết.',
    },
    {
      id: '3',
      code: 'REMOTE_ONSITE_PENDING',
      content:
        'Yêu cầu đăng ký làm việc Remote/Onsite của bạn đã bị từ chối. Vui lòng xem lý do hoặc liên hệ quản lý để biết thêm thông tin.',
    },
    {
      id: '4',
      code: 'USER_FEEDBACK',
      content:
        'Bạn đã gửi phản hồi thành công. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.',
    },
    {
      id: '5',
      code: 'REMIND_PASSWORD',
      content: 'Mật khẩu sắp hết hạn. Vui lòng đổi mật khẩu trước thời hạn.',
    },
    {
      id: '6',
      code: 'REMIND_PASSWORD',
      content: 'Mật khẩu sắp hết hạn. Vui lòng đổi mật khẩu trước thời hạn.',
    },
    {
      id: '7',
      code: 'REMIND_PASSWORD',
      content: 'Mật khẩu sắp hết hạn. Vui lòng đổi mật khẩu trước thời hạn.',
    },
    {
      id: '8',
      code: 'REMIND_PASSWORD',
      content: 'Mật khẩu sắp hết hạn. Vui lòng đổi mật khẩu trước thời hạn.',
    },
  ];

  protected get displayRange(): string {
    const start = (this.pageIndex - 1) * this.pageSize + 1;
    const end = Math.min(this.pageIndex * this.pageSize, this.total);
    return `${start}-${end}`;
  }

  protected onEdit(record: NotificationRecord): void {
    console.log('Edit:', record);
  }

  protected onApproveAll(): void {
    console.log('Duyệt tất cả');
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
