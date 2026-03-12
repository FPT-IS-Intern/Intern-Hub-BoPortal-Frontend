import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoDataComponent } from '../../components/no-data/no-data.component';

@Component({
  selector: 'app-checkin-location',
  standalone: true,
  imports: [CommonModule, NoDataComponent],
  template: `
    <div class="page-body">
      <header class="page-header">
        <nav class="breadcrumb">
          <a routerLink="/dashboard" class="breadcrumb-item home-link">
             <span class="custom-icon-home" style="width: 14px; height: 14px;"></span>
          </a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-item active">Địa điểm checkin</span>
        </nav>
        <h1 class="page-title">Địa điểm checkin</h1>
      </header>

      <div class="content-wrapper">
        <app-no-data 
          title="Chưa có dữ liệu địa điểm" 
          message="Tính năng quản lý địa điểm checkin đang được cập nhật.">
          <span icon class="custom-icon-globe" style="width: 64px; height: 64px; opacity: 0.2;"></span>
        </app-no-data>
      </div>
    </div>
  `,
  styles: [`
    .page-body {
      padding: 24px;
    }
    .page-header {
      margin-bottom: 32px;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      color: var(--app-color-text-muted, #64748b);
    }
    .breadcrumb-item.active {
      color: var(--app-color-primary, #2563eb);
      font-weight: 500;
    }
    .page-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--app-color-text-main, #1e293b);
    }
    .content-wrapper {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  `]
})
export class CheckinLocationComponent {}
