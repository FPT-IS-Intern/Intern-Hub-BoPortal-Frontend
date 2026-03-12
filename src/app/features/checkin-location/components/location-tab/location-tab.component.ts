import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NoDataComponent } from '../../../../components/no-data/no-data.component';
import { AttendanceLocation } from '../../../../models/checkin-config.model';

@Component({
  selector: 'app-location-tab',
  standalone: true,
  imports: [CommonModule, NzIconModule, NoDataComponent],
  template: `
    <div class="action-bar">
      <h3>Danh sách tọa độ cho phép</h3>
      <button class="add-btn" (click)="addLocation.emit()">
        <span nz-icon nzType="plus"></span> Thêm vị trí
      </button>
    </div>

    <div class="table-container">
      <table class="premium-table">
        <thead>
          <tr>
            <th>Tên vị trí</th>
            <th>Tọa độ (Lat/Long)</th>
            <th>Bán kính (m)</th>
            <th>Trạng thái</th>
            <th class="col-actions">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          @for (loc of locations; track loc.id) {
            <tr>
              <td class="font-semibold">{{ loc.name }}</td>
              <td>{{ loc.latitude }}, {{ loc.longitude }}</td>
              <td>{{ loc.radiusMeters }}m</td>
              <td>
                <span class="badge" [class.badge-success]="loc.isActive" [class.badge-error]="!loc.isActive">
                  {{ loc.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="col-actions">
                <button class="icon-btn edit" title="Sửa" (click)="editLocation.emit(loc)">
                  <span icon class="custom-icon-edit"></span>
                </button>
                <button class="icon-btn delete" title="Xóa" (click)="deleteLocation.emit(loc)">
                  <span icon class="custom-icon-close"></span>
                </button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5">
                <app-no-data title="Chưa có tọa độ" message="Vui lòng thêm các điểm check-in cho chi nhánh này.">
                  <span icon class="custom-icon-globe" style="width: 48px; height: 48px; opacity: 0.1;"></span>
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
export class LocationTabComponent {
  @Input() locations: AttendanceLocation[] = [];
  @Output() addLocation = new EventEmitter<void>();
  @Output() editLocation = new EventEmitter<AttendanceLocation>();
  @Output() deleteLocation = new EventEmitter<AttendanceLocation>();
}
