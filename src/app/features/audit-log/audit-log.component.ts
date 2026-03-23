import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { DataTableColumn, DataTableComponent } from '@/components/data-table/data-table.component';
import { SharedDropdownComponent, DropdownOption } from '@/components/shared-dropdown/shared-dropdown.component';
import { SharedSearchComponent } from '@/components/shared-search/shared-search.component';
import { PaginationComponent } from '@/components/pagination/pagination.component';
import { NoDataComponent } from '@/components/no-data/no-data.component';
import { SideDrawerComponent } from '@/components/popups/side-drawer/side-drawer.component';

import { BreadcrumbService } from '@/services/common/breadcrumb.service';
import { LoadingService } from '@/services/common/loading.service';
import { ToastService } from '@/services/common/toast.service';
import { AuditService } from '@/services/api/audit.service';
import { AuditItemResponse, AuditQueryRequest, ActionFunctionResponse } from '@/models/audit-log.model';

export interface AuditItemRow extends AuditItemResponse {
  hashValid?: boolean;
}

@Component({
  selector: 'app-audit-log',
  standalone: true, 
  imports: [
    CommonModule, 
    FormsModule,
    TranslateModule, 
    NoDataComponent,
    DataTableComponent,
    SharedDropdownComponent,
    SharedSearchComponent,
    PaginationComponent,
    SideDrawerComponent
  ],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly loadingService = inject(LoadingService);
  private readonly toastService = inject(ToastService);
  private readonly auditService = inject(AuditService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly baseColumns: DataTableColumn[] = [
    { key: 'id', width: '80px', label: 'ID' },
    { key: 'timeStamp', width: '180px', label: 'Thời gian' },
    { key: 'traceId', minWidth: '200px', label: 'Trace ID' },
    { key: 'actor', minWidth: '150px', label: 'Người dùng' },
    { key: 'entity', minWidth: '150px', label: 'Đối tượng' },
    { key: 'action', width: '120px', label: 'Hành động' },
    { key: 'actionStatus', width: '120px', label: 'Trạng thái', align: 'center' },
    { key: 'actions', width: '100px', label: 'Thao tác', align: 'center' },
  ];

  protected readonly columns = signal<DataTableColumn[]>(this.baseColumns);
  protected readonly rows = signal<AuditItemRow[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 20, 50];

  protected readonly keyword = signal('');
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly selectedAction = signal('');

  protected readonly isLoading = signal(true);
  protected readonly isFiltering = signal(false);
  protected readonly isError = signal(false);

  // Drawer / Diff Viewer State
  protected readonly drawerVisible = signal(false);
  protected readonly selectedAudit = signal<AuditItemRow | null>(null);

  // Action Function Management State
  protected readonly actionDrawerVisible = signal(false);
  protected readonly actionList = signal<ActionFunctionResponse[]>([]);
  protected readonly isActionLoading = signal(false);
  protected readonly newActionBody = signal({ action: '', description: '' });

  protected readonly actionOptions = signal<DropdownOption[]>([
    { label: 'Tất cả hành động', value: '' }
  ]);

  ngOnInit(): void {
    this.updateBreadcrumbs();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateBreadcrumbs());

    this.loadActionFunctions();
    this.loadAudits();
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('checkin.breadcrumb.home'), icon: 'dsi-home-01-line', url: '/main' },
      { label: this.translate.instant('auditLog.breadcrumb.title'), active: true }
    ]);
  }

  // ---- FILTERS ----
  protected onSearchChange(val: string): void {
    this.keyword.set(val);
    this.applyFilters();
  }

  protected onStartDateChange(val: string): void {
    this.startDate.set(val);
    this.applyFilters();
  }

  protected onEndDateChange(val: string): void {
    this.endDate.set(val);
    this.applyFilters();
  }

  protected onActionChange(val: any): void {
    this.selectedAction.set(val || '');
    this.applyFilters();
  }

  protected applyFilters(): void {
    this.pageIndex.set(1);
    this.loadAudits(false);
  }

  protected clearFilters(): void {
    this.keyword.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.selectedAction.set('');
    this.pageIndex.set(1);
    this.loadAudits();
  }

  // ---- PAGINATION ----
  protected onPageIndexChange(page: number): void {
    this.pageIndex.set(page);
    this.loadAudits(false);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadAudits(false);
  }

  // ---- API QUERIES ----
  private loadAudits(showPageLoading = true): void {
    const req: AuditQueryRequest = {
      page: this.pageIndex() - 1,
      size: this.pageSize(),
      startDate: this.startDate() || undefined,
      endDate: this.endDate() || undefined,
      action: this.selectedAction() || undefined,
    };

    // If searching, we could pass keyword if backend supported it. 
    // Usually backend maps it to 'entity' or 'actor', assuming we can't search via DTO for now, 
    // or maybe backend supports it out of DTO. We stick to DTO spec.

    this.isError.set(false);
    if (showPageLoading) {
      this.isLoading.set(true);
      this.loadingService.showPageLoading();
      this.isFiltering.set(false);
    } else {
      this.isFiltering.set(true);
    }

    this.auditService.queryAudits(req)
      .pipe(finalize(() => {
        if (showPageLoading) {
          this.isLoading.set(false);
          this.loadingService.hidePageLoading();
        }
        this.isFiltering.set(false);
      }))
      .subscribe({
        next: (res) => {
          this.rows.set(res.data?.content || []);
          this.totalItems.set(res.data?.totalElements || 0);
        },
        error: () => {
          this.rows.set([]);
          this.totalItems.set(0);
          this.isError.set(true);
        }
      });
  }

  // ---- ACTIONS ----
  protected verifyHash(row: AuditItemRow): void {
    this.auditService.verifyHash(row.id).subscribe({
      next: (res) => {
        const isValid = res.data?.valid === true;
        
        // Update row visually
        this.rows.update(current => 
          current.map(r => r.id === row.id ? { ...r, hashValid: isValid } : r)
        );

        if (isValid) {
          this.toastService.success(`Log #${row.id} hợp lệ và an toàn.`);
        } else {
          this.toastService.error(`Log #${row.id} có dấu hiệu bị thao túng hoặc không toàn vẹn!`);
        }
      },
      error: () => this.toastService.error(`Không thể kiểm tra Log #${row.id}`)
    });
  }

  protected openDiff(row: AuditItemRow): void {
    this.selectedAudit.set(row);
    this.drawerVisible.set(true);
  }

  protected closeDrawer(): void {
    this.drawerVisible.set(false);
    this.selectedAudit.set(null);
  }

  // ---- ACTION FUNCTION MANAGEMENT ----
  protected loadActionFunctions(): void {
    this.auditService.getActionFunctions().subscribe({
      next: (res) => {
        const list = res.data || [];
        this.actionList.set(list);
        
        // Update selection options
        const options: DropdownOption[] = [
          { label: 'Tất cả hành động', value: '' },
          ...list.map(a => ({ label: a.action, value: a.action }))
        ];
        this.actionOptions.set(options);
      },
      error: () => this.toastService.error('Không thể tải danh sách hành động')
    });
  }

  protected openActionManager(): void {
    this.actionDrawerVisible.set(true);
  }

  protected createActionFunction(): void {
    const body = this.newActionBody();
    if (!body.action.trim()) {
      this.toastService.warning('Vui lòng nhập mã hành động');
      return;
    }

    this.isActionLoading.set(true);
    this.auditService.createActionFunction(body)
      .pipe(finalize(() => this.isActionLoading.set(false)))
      .subscribe({
        next: () => {
          this.toastService.success('Thêm hành động thành công');
          this.newActionBody.set({ action: '', description: '' });
          this.loadActionFunctions();
        },
        error: () => this.toastService.error('Không thể thêm hành động')
      });
  }

  // ---- UTILS ----
  protected formatDateTime(val: string): string {
    if (!val) return '-';
    try {
      const d = new Date(val);
      // fallback format roughly matched to UI
      return d.toLocaleString('vi-VN'); 
    } catch {
      return val;
    }
  }

  protected formatJson(val: string): string {
    if (!val) return '';
    try {
      const obj = JSON.parse(val);
      return JSON.stringify(obj, null, 2);
    } catch {
      return val;
    }
  }
}
