import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoDataComponent } from '../../components/no-data/no-data.component';
import { BreadcrumbService } from '../../services/breadcrumb.service';

@Component({
  selector: 'app-checkin-location',
  standalone: true,
  imports: [CommonModule, RouterModule, NoDataComponent],
  template: `
    <div class="page-body">
      <header class="page-header">
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
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .page-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--app-color-text-main, #1e293b);
      margin: 0;
    }
    .content-wrapper {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  `]
})
export class CheckinLocationComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Home', icon: 'custom-icon-home', url: '/main' },
      { label: 'Địa điểm checkin', active: true }
    ]);
  }
}
