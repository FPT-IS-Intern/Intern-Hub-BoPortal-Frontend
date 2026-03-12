import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NoDataComponent } from '../../../../components/no-data/no-data.component';
import { IPRange } from '../../../../models/checkin-config.model';

@Component({
  selector: 'app-ip-tab',
  standalone: true,
  imports: [CommonModule, NzIconModule, NoDataComponent],
  template: `
    <div class="action-bar">
      <h3>Cấu hình IP văn phòng</h3>
      <button class="add-btn" (click)="addIP.emit()">
        <span nz-icon nzType="plus"></span> Thêm dải IP
      </button>
    </div>

    <div class="table-container">
      <table class="premium-table">
        <thead>
          <tr>
            <th>Tên gợi nhớ</th>
            <th>Dải IP Prefix</th>
            <th>Mô tả</th>
            <th>Trạng thái</th>
            <th class="col-actions">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          @for (ip of ipRanges; track ip.id) {
            <tr>
              <td class="font-semibold">{{ ip.name }}</td>
              <td><code class="ip-code">{{ ip.ipPrefix }}</code></td>
              <td class="text-muted">{{ ip.description }}</td>
              <td>
                <span class="badge" [class.badge-success]="ip.isActive" [class.badge-error]="!ip.isActive">
                  {{ ip.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="col-actions">
                <button class="icon-btn edit" title="Sửa" (click)="editIP.emit(ip)">
                  <span icon class="custom-icon-edit"></span>
                </button>
                <button class="icon-btn delete" title="Xóa" (click)="deleteIP.emit(ip)">
                  <span icon class="custom-icon-close"></span>
                </button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5">
                <app-no-data title="Chưa có dải IP" message="Cho phép check-in qua WiFi bằng cách thêm dải IP văn phòng.">
                  <span icon class="custom-icon-settings" style="width: 48px; height: 48px; opacity: 0.1;"></span>
                </app-no-data>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .action-bar {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
      h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--app-color-text-main); }
    }
    .add-btn {
      display: inline-flex; align-items: center; gap: 8px; background: var(--app-color-primary);
      color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 14px;
      font-weight: 600; cursor: pointer; transition: transform 0.1s, opacity 0.2s;
      &:hover { opacity: 0.9; } &:active { transform: scale(0.98); }
    }
    .premium-table {
      width: 100%; border-collapse: separate; border-spacing: 0;
      th {
        padding: 12px 16px; background: var(--app-color-surface-warm-100); text-align: left;
        font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--app-color-text-muted);
        border-bottom: 1px solid var(--app-color-surface-warm-200);
        &:first-child { border-radius: 8px 0 0 0; } &:last-child { border-radius: 0 8px 0 0; }
      }
      td { padding: 16px; border-bottom: 1px solid var(--app-color-surface-warm-100); font-size: 14px; color: var(--app-color-text-main); }
      tr:hover td { background: var(--app-color-surface-warm-50); }
    }
    .font-semibold { font-weight: 600; }
    .text-muted { color: var(--app-color-text-muted); font-size: 13px; }
    .ip-code { background: var(--app-color-surface-warm-200); padding: 2px 8px; border-radius: 4px; font-family: monospace; color: var(--brand-700); }
    .badge {
      padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;
      &-success { background: #d1fae5; color: #065f46; }
      &-error { background: #fee2e2; color: #991b1b; }
    }
    .col-actions { text-align: right; white-space: nowrap; width: 100px; }
    .icon-btn {
      width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;
      border: none; background: transparent; border-radius: 6px; cursor: pointer; transition: all 0.2s;
      color: var(--app-color-text-muted);
      &:hover { background: var(--app-color-surface-warm-200); }
      &.edit:hover { color: var(--app-color-primary); }
      &.delete:hover { color: #ef4444; }
    }
  `]
})
export class IpTabComponent {
  @Input() ipRanges: IPRange[] = [];
  @Output() addIP = new EventEmitter<void>();
  @Output() editIP = new EventEmitter<IPRange>();
  @Output() deleteIP = new EventEmitter<IPRange>();
}
