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

type RowConfirmAction = 'lock' | 'unlock';
type DrawerTab = 'info' | 'login';

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
    { key: 'sysStatus', label: 'users.table.status', width: '160px', align: 'center' },
    { key: 'role', label: 'users.table.role', minWidth: '160px' },
    { key: 'position', label: 'users.table.position', minWidth: '160px' },
    { key: 'actions', label: 'users.table.actions', width: '140px', align: 'center' },
  ];

  protected readonly rows = signal<UserListItem[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 20, 50];

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

  protected readonly drawerVisible = signal(false);
  protected readonly drawerLoading = signal(false);
  protected readonly drawerTab = signal<DrawerTab>('info');
  protected readonly selectedUser = signal<UserDetail | null>(null);

  protected readonly confirmVisible = signal(false);
  protected readonly pendingAction = signal<RowConfirmAction | null>(null);
  protected readonly pendingUser = signal<UserListItem | UserDetail | null>(null);
  protected readonly actionMenuUserId = signal<number | null>(null);

  protected readonly roleOptions = signal<DropdownOption[]>([{ label: 'Tất cả vai trò', value: '' }]);
  protected readonly positionOptions = signal<DropdownOption[]>([{ label: 'Tất cả chức vụ', value: '' }]);

  protected readonly statusOptions: DropdownOption[] = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Chờ duyệt', value: 'PENDING' },
    { label: 'Đã duyệt', value: 'APPROVED' },
    { label: 'Từ chối', value: 'REJECTED' },
    { label: 'Tạm dừng', value: 'SUSPENDED' },
  ];

  protected readonly displayRange = computed(() => {
    const total = this.totalItems();
    if (total === 0) {
      return '0-0 / 0';
    }
    const start = (this.pageIndex() - 1) * this.pageSize() + 1;
    const end = Math.min(this.pageIndex() * this.pageSize(), total);
    return `${start}-${end} / ${total}`;
  });

  protected readonly drawerTitle = computed(() => {
    const user = this.selectedUser();
    return user ? user.fullName || 'Chi tiết người dùng' : 'Chi tiết người dùng';
  });

  protected readonly confirmTitle = computed(() =>
    this.pendingAction() === 'unlock' ? 'Mở khóa đăng nhập' : 'Khóa đăng nhập',
  );

  protected readonly confirmMessage = computed(() => {
    const userName = this.pendingUser()?.fullName || 'người dùng này';
    return this.pendingAction() === 'unlock'
      ? `Bạn có chắc muốn mở khóa đăng nhập cho ${userName}?`
      : `Bạn có chắc muốn khóa đăng nhập của ${userName}?`;
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

    this.loadMetaOptions();
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
    this.loadUsers(false);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadUsers(false);
  }

  protected trackUser(_index: number, row: UserListItem): number {
    return row.userId;
  }

  protected safeValue(value?: string | null): string {
    return value && value.trim().length > 0 ? value : '-';
  }

  protected avatarFallback(name?: string | null): string {
    const normalized = `${name || ''}`.trim();
    if (!normalized) return '?';
    const [first = '', second = ''] = normalized.split(/\s+/);
    return `${first.charAt(0)}${second.charAt(0)}`.trim().toUpperCase() || normalized.charAt(0).toUpperCase();
  }

  protected businessStatusLabel(status?: string | null): string {
    switch (`${status || ''}`.toUpperCase()) {
      case 'PENDING':
        return 'Chờ duyệt';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'REJECTED':
        return 'Từ chối';
      case 'SUSPENDED':
        return 'Tạm dừng';
      default:
        return 'Chưa xác định';
    }
  }

  protected businessStatusClass(status?: string | null): string {
    switch (`${status || ''}`.toUpperCase()) {
      case 'PENDING':
        return 'status-chip pending';
      case 'APPROVED':
        return 'status-chip approved';
      case 'REJECTED':
        return 'status-chip rejected';
      case 'SUSPENDED':
        return 'status-chip suspended';
      default:
        return 'status-chip inactive';
    }
  }

  protected loginStatusLabel(status?: string | null): string {
    switch (`${status || ''}`.toUpperCase()) {
      case 'ACTIVE':
        return 'Cho phép đăng nhập';
      case 'INACTIVE':
        return 'Ngừng truy cập';
      case 'SUSPENDED':
        return 'Đã khóa đăng nhập';
      default:
        return 'Chưa xác định';
    }
  }

  protected loginStatusClass(status?: string | null): string {
    switch (`${status || ''}`.toUpperCase()) {
      case 'ACTIVE':
        return 'status-chip active';
      case 'SUSPENDED':
        return 'status-chip locked';
      case 'INACTIVE':
        return 'status-chip inactive';
      default:
        return 'status-chip inactive';
    }
  }

  protected isLoginLocked(user: UserListItem | UserDetail | null | undefined): boolean {
    if (!user) return false;
    const status = 'loginStatus' in user ? user.loginStatus : undefined;
    return `${status || ''}`.toUpperCase() === 'SUSPENDED';
  }

  protected toggleActionMenu(userId: number, event: Event): void {
    event.stopPropagation();
    this.actionMenuUserId.set(this.actionMenuUserId() === userId ? null : userId);
  }

  protected closeActionMenu(): void {
    this.actionMenuUserId.set(null);
  }

  protected openUserDetail(userId: number): void {
    this.drawerTab.set('info');
    this.drawerVisible.set(true);
    this.drawerLoading.set(true);
    this.selectedUser.set(null);
    this.closeActionMenu();

    this.userManagementService.getUserById(userId)
      .pipe(finalize(() => this.drawerLoading.set(false)))
      .subscribe({
        next: (res) => this.selectedUser.set(res.data ?? null),
        error: () => this.toastService.error('Không thể tải chi tiết người dùng'),
      });
  }

  protected closeDrawer(): void {
    this.drawerVisible.set(false);
  }

  protected requestAction(user: UserListItem | UserDetail, action: RowConfirmAction, event?: Event): void {
    event?.stopPropagation();
    this.pendingUser.set(user);
    this.pendingAction.set(action);
    this.confirmVisible.set(true);
    this.closeActionMenu();
  }

  protected cancelPendingAction(): void {
    this.confirmVisible.set(false);
    this.pendingUser.set(null);
    this.pendingAction.set(null);
  }

  protected confirmPendingAction(): void {
    const action = this.pendingAction();
    const user = this.pendingUser();
    if (!action || !user) {
      this.cancelPendingAction();
      return;
    }

    const request$ = action === 'unlock'
      ? this.userManagementService.unlockUser(user.userId)
      : this.userManagementService.lockUser(user.userId);

    this.confirmVisible.set(false);
    request$.subscribe({
      next: (res) => {
        if (this.selectedUser()?.userId === user.userId) {
          this.selectedUser.set(res.data ?? null);
        }
        this.toastService.success(action === 'unlock'
          ? 'Mở khóa đăng nhập thành công'
          : 'Khóa đăng nhập thành công');
        this.loadUsers(false);
      },
      error: () => this.toastService.error('Không thể thực hiện thao tác'),
    });

    this.pendingUser.set(null);
    this.pendingAction.set(null);
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

    this.userManagementService.filterUsers(request, this.pageIndex(), this.pageSize())
      .pipe(finalize(() => {
        if (showLoading) {
          this.isLoading.set(false);
          this.loadingService.hidePageLoading();
        }
      }))
      .subscribe({
        next: (res) => {
          this.rows.set(res.data?.items ?? []);
          this.totalItems.set(res.data?.totalItems ?? 0);
        },
        error: () => {
          this.rows.set([]);
          this.totalItems.set(0);
          this.isError.set(true);
        },
      });
  }

  private loadMetaOptions(): void {
    this.userManagementService.getMetaOptions().subscribe({
      next: (res) => {
        this.roleOptions.set(this.toOptions(res.data?.roles ?? [], 'Tất cả vai trò'));
        this.positionOptions.set(this.toOptions(res.data?.positions ?? [], 'Tất cả chức vụ'));
      },
    });
  }

  private toOptions(values: string[], allLabel: string): DropdownOption[] {
    return [{ label: allLabel, value: '' }, ...values.map((value) => ({ label: value, value }))];
  }
}
