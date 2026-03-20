import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../services/common/breadcrumb.service';
import { NoDataComponent } from '../../components/no-data/no-data.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, TranslateModule, NoDataComponent],
  template: `
    <div class="audit-log-container">
      <div class="audit-log-header">
        <h1 class="page-title">
          <span class="custom-icon-package-search title-icon"></span>
          {{ 'auditLog.title' | translate }}
        </h1>
      </div>

      <div class="audit-log-content">
        <app-no-data 
          [title]="'auditLog.empty.title' | translate"
          [message]="'auditLog.empty.message' | translate">
          <span icon class="custom-icon-package-search empty-icon"></span>
        </app-no-data>
      </div>
    </div>
  `,
  styles: [`
    .audit-log-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      height: 100%;
    }

    .audit-log-header {
      .page-title {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        color: var(--app-color-text-main);
        display: flex;
        align-items: center;
        gap: 12px;

        .title-icon {
          color: var(--app-color-primary);
        }
      }
    }

    .audit-log-content {
      flex: 1;
      background: var(--app-color-white);
      border-radius: 12px;
      border: 1px solid var(--app-color-border-alpha-soft, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .empty-icon {
      font-size: 64px;
      opacity: 0.2;
      color: var(--app-color-text-subtle);
    }
  `]
})
export class AuditLogComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  ngOnInit(): void {
    this.updateBreadcrumbs();
    this.translate.onLangChange.subscribe(() => this.updateBreadcrumbs());
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('checkin.breadcrumb.home'), icon: 'custom-icon-home', url: '/main' },
      { label: this.translate.instant('auditLog.breadcrumb.title'), active: true }
    ]);
  }
}
