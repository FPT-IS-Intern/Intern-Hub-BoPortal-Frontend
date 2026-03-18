import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { DataTableColumn, DataTableComponent } from '../../components/data-table/data-table.component';
import {
  DropdownOption,
  SharedDropdownComponent,
} from '../../components/shared-dropdown/shared-dropdown.component';
import { SharedSearchComponent } from '../../components/shared-search/shared-search.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { NoDataComponent } from '../../components/no-data/no-data.component';
import { TableSkeletonComponent } from '../../components/skeletons/table-skeleton/table-skeleton.component';
import { ConfirmPopup } from '../../components/popups/confirm-popup/confirm-popup';
import { SideDrawerComponent } from '../../components/popups/side-drawer/side-drawer.component';
import { BreadcrumbService } from '../../services/common/breadcrumb.service';
import { LoadingService } from '../../services/common/loading.service';
import { ToastService } from '../../services/common/toast.service';
import { UserManagementService } from '../../services/api/user-management.service';
import {
  UserDetail,
  UserFilterRequest,
  UserListItem,
} from '../../models/user-management.model';

type UserActionType = 'lock' | 'unlock';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SharedSearchComponent,
    SharedDropdownComponent,
    DataTableComponent,
    PaginationComponent,
    NoDataComponent,
    TableSkeletonComponent,
    ConfirmPopup,
    SideDrawerComponent,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent {
  private readonly userManagementService = inject(UserManagementService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translateService = inject(TranslateService);
  private readonly loadingService = inject(LoadingService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columns: DataTableColumn[] = [
    { key: 'no', label: 'users.table.no', width: '72px', align: 'center' },
    { key: 'user', label: 'users.table.user', minWidth: '240px' },
    { key: 'email', label: 'users.table.email', minWidth: '220px' },
    { key: 'sysStatus', label: 'users.table.status', width: '140px', align: 'center' },
    { key: 'role', label: 'users.table.role', minWidth: '160px' },
    { key: 'position', label: 'users.table.position', minWidth: '160px' },
    { key: 'actions', label: 'users.table.actions', width: '190px', align: 'center' },
  ];

  protected readonly rows = signal<UserListItem[]>([]);
  protected readonly pageSizeOptions = [10, 20, 50];
  protected readonly totalItems = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly keyword = signal('');
  protected readonly selectedStatus = signal('');
  protected readonly selectedRole = signal('');
  protected readonly selectedPosition = signal('');
  protected readonly appliedKeyword = signal('');
  protected readonly appliedStatus = signal('');
  protected readonly appliedRole = signal('');
  protected readonly appliedPosition = signal('');
  protected readonly isLoading = signal(true);
  protected readonly isError = signal(false);
  protected readonly isDetailVisible = signal(false);
  protected readonly isDetailLoading = signal(false);
  protected readonly selectedUser = signal<UserDetail | null>(null);
  protected readonly confirmVisible = signal(false);
  protected readonly pendingAction = signal<UserActionType | null>(null);
  protected readonly pendingUser = signal<UserListItem | null>(null);
  protected readonly roleOptions = signal<DropdownOption[]>([
    { label: 'users.filters.allRoles', value: '' },
  ]);
  protected readonly positionOptions = signal<DropdownOption[]>([
    { label: 'users.filters.allPositions', value: '' },
  ]);

  protected readonly statusOptions: DropdownOption[] = [
    { label: 'users.filters.allStatuses', value: '' },
    { label: 'users.status.active', value: 'ACTIVE' },
    { label: 'users.status.locked', value: 'LOCKED' },
    { label: 'users.status.inactive', value: 'INACTIVE' },
  ];

  protected readonly displayRange = computed(() => {
    const total = this.totalItems();
    if (total === 0) {
      return this.translateService.instant('users.pagination.empty');
    }
    const start = (this.pageIndex() - 1) * this.pageSize() + 1;
    const end = Math.min(this.pageIndex() * this.pageSize(), total);
    return this.translateService.instant('users.pagination.range', { start, end, total });
  });

  protected readonly showPagination = computed(() => this.totalItems() > this.pageSize());
  protected readonly confirmTitle = computed(() => {
    const action = this.pendingAction();
    return action === 'lock'
      ? this.translateService.instant('users.confirm.lockTitle')
      : this.translateService.instant('users.confirm.unlockTitle');
  });

  protected readonly confirmMessage = computed(() => {
    const user = this.pendingUser();
    const fullName = user?.fullName || '-';
    return this.pendingAction() === 'lock'
      ? this.translateService.instant('users.confirm.lockMessage', { name: fullName })
      : this.translateService.instant('users.confirm.unlockMessage', { name: fullName });
  });

  constructor() {
    this.translateService
      .stream('users.breadcrumb.title')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((title) => {
        this.breadcrumbService.setBreadcrumbs([
          { label: this.translateService.instant('checkin.breadcrumb.home'), icon: 'custom-icon-home', url: '/main' },
          { label: title, active: true },
        ]);
      });

    this.loadUsers();
  }

  protected onSearchChange(value: string): void {
    this.keyword.set(value);
  }

  protected onStatusChange(value: string): void {
    this.selectedStatus.set(value);
  }

  protected onRoleChange(value: string): void {
    this.selectedRole.set(value);
  }

  protected onPositionChange(value: string): void {
    this.selectedPosition.set(value);
  }

  protected search(): void {
    this.pageIndex.set(1);
    this.appliedKeyword.set(this.keyword().trim());
    this.appliedStatus.set(this.selectedStatus());
    this.appliedRole.set(this.selectedRole());
    this.appliedPosition.set(this.selectedPosition());
    this.loadUsers();
  }

  protected resetFilters(): void {
    this.keyword.set('');
    this.selectedStatus.set('');
    this.selectedRole.set('');
    this.selectedPosition.set('');
    this.appliedKeyword.set('');
    this.appliedStatus.set('');
    this.appliedRole.set('');
    this.appliedPosition.set('');
    this.pageIndex.set(1);
    this.loadUsers();
  }

  protected refresh(): void {
    this.loadUsers();
  }

  protected onPageIndexChange(page: number): void {
    this.pageIndex.set(page);
    this.loadUsers();
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadUsers();
  }

  protected openUserDetail(userId: number): void {
    this.isDetailVisible.set(true);
    this.isDetailLoading.set(true);
    this.selectedUser.set(null);
    this.userManagementService
      .getUserById(userId)
      .pipe(finalize(() => this.isDetailLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.selectedUser.set(res.data ?? null);
        },
        error: () => {
          this.toastService.errorKey('users.toast.loadDetailError', 'toast.system');
        },
      });
  }

  protected closeDetail(): void {
    this.isDetailVisible.set(false);
    this.selectedUser.set(null);
  }

  protected requestToggleStatus(user: UserListItem): void {
    const action: UserActionType = this.isLocked(user.sysStatus) ? 'unlock' : 'lock';
    this.pendingAction.set(action);
    this.pendingUser.set(user);
    this.confirmVisible.set(true);
  }

  protected cancelToggleStatus(): void {
    this.confirmVisible.set(false);
    this.pendingAction.set(null);
    this.pendingUser.set(null);
  }

  protected confirmToggleStatus(): void {
    const user = this.pendingUser();
    const action = this.pendingAction();
    if (!user || !action) {
      this.cancelToggleStatus();
      return;
    }

    const request$ = action === 'lock'
      ? this.userManagementService.lockUser(user.userId)
      : this.userManagementService.unlockUser(user.userId);

    this.confirmVisible.set(false);
    this.loadingService.showGlobalLoading();

    request$
      .pipe(finalize(() => this.loadingService.hideGlobalLoading()))
      .subscribe({
        next: (res) => {
          const detail = res.data ?? null;
          if (this.selectedUser()?.userId === user.userId) {
            this.selectedUser.set(detail);
          }
          this.toastService.successKey(
            action === 'lock' ? 'users.toast.lockSuccess' : 'users.toast.unlockSuccess',
            'toast.system',
          );
          this.loadUsers(false);
        },
        error: () => {
          this.toastService.errorKey(
            action === 'lock' ? 'users.toast.lockError' : 'users.toast.unlockError',
            'toast.system',
          );
        },
      });

    this.pendingAction.set(null);
    this.pendingUser.set(null);
  }

  protected statusLabel(status?: string | null): string {
    const normalized = `${status || ''}`.toUpperCase();
    if (normalized === 'LOCKED') {
      return this.translateService.instant('users.status.locked');
    }
    if (normalized === 'INACTIVE') {
      return this.translateService.instant('users.status.inactive');
    }
    return this.translateService.instant('users.status.active');
  }

  protected statusClass(status?: string | null): string {
    const normalized = `${status || ''}`.toUpperCase();
    if (normalized === 'LOCKED') {
      return 'status-chip locked';
    }
    if (normalized === 'INACTIVE') {
      return 'status-chip inactive';
    }
    return 'status-chip active';
  }

  protected actionLabel(status?: string | null): string {
    return this.isLocked(status)
      ? this.translateService.instant('users.actions.unlock')
      : this.translateService.instant('users.actions.lock');
  }

  protected toggleSelectedUserStatus(): void {
    const user = this.selectedUser();
    if (!user) {
      return;
    }
    this.requestToggleStatus({
      userId: user.userId,
      fullName: user.fullName,
      sysStatus: user.status,
    });
  }

  protected trackUser(_index: number, row: UserListItem): number {
    return row.userId;
  }

  protected safeValue(value?: string | null): string {
    return value && value.trim().length > 0 ? value : '-';
  }

  protected avatarFallback(name?: string | null): string {
    const normalized = `${name || ''}`.trim();
    if (!normalized) {
      return '?';
    }
    const [first = '', second = ''] = normalized.split(/\s+/);
    return `${first.charAt(0)}${second.charAt(0)}`.trim().toUpperCase() || normalized.charAt(0).toUpperCase();
  }

  private isLocked(status?: string | null): boolean {
    const normalized = `${status || ''}`.toUpperCase();
    return normalized === 'LOCKED' || normalized === 'INACTIVE';
  }

  private loadUsers(showLoading = true): void {
    const request: UserFilterRequest = {
      keyword: this.appliedKeyword() || undefined,
      sysStatuses: this.appliedStatus() ? [this.appliedStatus()] : undefined,
      roles: this.appliedRole() ? [this.appliedRole()] : undefined,
      positions: this.appliedPosition() ? [this.appliedPosition()] : undefined,
    };

    this.isError.set(false);
    if (showLoading) {
      this.isLoading.set(true);
      this.loadingService.showPageLoading();
    }

    this.userManagementService
      .filterUsers(request, this.pageIndex(), this.pageSize())
      .pipe(
        finalize(() => {
          if (showLoading) {
            this.isLoading.set(false);
            this.loadingService.hidePageLoading();
          }
        }),
      )
      .subscribe({
        next: (res) => {
          const data = res.data;
          this.rows.set(data?.items ?? []);
          this.totalItems.set(data?.totalItems ?? 0);
          this.totalPages.set(data?.totalPages ?? 0);
          this.updateDynamicFilterOptions(data?.items ?? []);
        },
        error: () => {
          this.rows.set([]);
          this.totalItems.set(0);
          this.totalPages.set(0);
          this.isError.set(true);
        },
      });
  }

  private updateDynamicFilterOptions(items: UserListItem[]): void {
    this.roleOptions.set(
      this.toDynamicOptions(items.map((item) => item.role), 'users.filters.allRoles', this.selectedRole()),
    );
    this.positionOptions.set(
      this.toDynamicOptions(items.map((item) => item.position), 'users.filters.allPositions', this.selectedPosition()),
    );
  }

  private toDynamicOptions(
    values: Array<string | undefined>,
    allLabelKey: string,
    selectedValue = '',
  ): DropdownOption[] {
    const uniqueValues = Array.from(
      new Set(
        values
          .map((value) => `${value || ''}`.trim())
          .filter((value) => value.length > 0),
      ),
    ).sort((left, right) => left.localeCompare(right));

    if (selectedValue && !uniqueValues.includes(selectedValue)) {
      uniqueValues.unshift(selectedValue);
    }

    return [
      { label: allLabelKey, value: '' },
      ...uniqueValues.map((value) => ({ label: value, value })),
    ];
  }
}
