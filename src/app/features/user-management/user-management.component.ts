import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { DataTableColumn, DataTableComponent } from '../../components/data-table/data-table.component';
import { DropdownOption, SharedDropdownComponent } from '../../components/shared-dropdown/shared-dropdown.component';
import { SharedSearchComponent } from '../../components/shared-search/shared-search.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { NoDataComponent } from '../../components/no-data/no-data.component';
import { TableSkeletonComponent } from '../../components/skeletons/table-skeleton/table-skeleton.component';
import { UserDrawerSkeletonComponent } from '../../components/skeletons/user-drawer-skeleton/user-drawer-skeleton.component';
import { ConfirmPopup } from '../../components/popups/confirm-popup/confirm-popup';
import { SideDrawerComponent } from '../../components/popups/side-drawer/side-drawer.component';
import { BreadcrumbService } from '../../services/common/breadcrumb.service';
import { LoadingService } from '../../services/common/loading.service';
import { ToastService } from '../../services/common/toast.service';
import { UserManagementService } from '../../services/api/user-management.service';
import {
  AuthzRole,
  UserDetail,
  UserFilterRequest,
  UserHistoryRecord,
  UserId,
  UserListItem,
} from '../../models/user-management.model';

type DrawerTab = 'profile' | 'access' | 'trace';
type ConfirmAction = 'lock' | 'unlock' | 'reset-password' | 'approve' | 'reactivate' | 'assign-role';
type ModalAction = 'reject' | 'suspend' | 'edit-profile' | 'assign-role';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    SharedSearchComponent,
    SharedDropdownComponent,
    DataTableComponent,
    PaginationComponent,
    NoDataComponent,
    TableSkeletonComponent,
    UserDrawerSkeletonComponent,
    ConfirmPopup,
    SideDrawerComponent,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent {
  private readonly baseColumns: DataTableColumn[] = [
    { key: 'no', width: '60px', align: 'center' },
    { key: 'user', minWidth: '220px' },
    { key: 'email', minWidth: '200px' },
    { key: 'role', minWidth: '130px' },
    { key: 'position', minWidth: '150px' },
    { key: 'sysStatus', width: '130px', align: 'center' },
  ];

  private readonly userManagementService = inject(UserManagementService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translateService = inject(TranslateService);
  private readonly loadingService = inject(LoadingService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columns: DataTableColumn[] = [];
  protected readonly searchPlaceholder = signal('');


  // --- List state ---
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

  // --- Drawer state ---
  protected readonly drawerVisible = signal(false);
  protected readonly drawerLoading = signal(false);
  protected readonly drawerTab = signal<DrawerTab>('profile');
  protected readonly selectedUser = signal<UserDetail | null>(null);
  protected readonly activityHistory = signal<UserHistoryRecord[]>([]);
  protected readonly loginHistory = signal<UserHistoryRecord[]>([]);

  // --- Role state ---
  protected readonly userRoles = signal<AuthzRole[]>([]);
  protected readonly allRoles = signal<AuthzRole[]>([]);
  protected readonly rolesLoading = signal(false);
  protected readonly roleChangeOptions = computed<DropdownOption[]>(() =>
    this.allRoles().map((r) => ({ label: r.name, value: r.id.toString() })),
  );

  // --- Confirm dialog ---
  protected readonly confirmVisible = signal(false);
  protected readonly pendingAction = signal<ConfirmAction| null>(null);
  protected readonly pendingActionRoleId = signal<string | null>(null);

  // --- Modal (reject/suspend/edit/assign-role) ---
  protected readonly modalVisible = signal(false);
  protected readonly pendingModal = signal<ModalAction | null>(null);
  protected readonly modalReason = signal('');
  protected readonly modalReasonError = signal('');

  // --- Profile edit ---
  protected readonly editFullName = signal('');
  protected readonly editPhone = signal('');
  protected readonly editPosition = signal('');
  protected readonly editDepartment = signal('');

  // --- Assign role ---
  protected readonly selectedNewRoleId = signal<string | null>(null);
  protected readonly listColumns = signal<DataTableColumn[]>(this.baseColumns);
  protected readonly listSearchPlaceholder = signal('');
  protected readonly listRoleOptions = signal<DropdownOption[]>([]);
  protected readonly listPositionOptions = signal<DropdownOption[]>([]);
  protected readonly listStatusOptions = signal<DropdownOption[]>([]);

  // --- Metadata dropdowns ---
  protected readonly roleOptions = signal<DropdownOption[]>([{ label: 'Tất cả vai trò', value: '' }]);
  protected readonly positionOptions = signal<DropdownOption[]>([{ label: 'Tất cả chức danh', value: '' }]);
  protected readonly statusOptions: DropdownOption[] = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Chờ duyệt', value: 'PENDING' },
    { label: 'Đã duyệt', value: 'APPROVED' },
    { label: 'Từ chối', value: 'REJECTED' },
    { label: 'Tạm dừng', value: 'SUSPENDED' },
  ];

  // --- Computed ---
  protected readonly displayRange = computed(() => {
    const total = this.totalItems();
    if (total === 0) return '0-0 / 0';
    const start = (this.pageIndex() - 1) * this.pageSize() + 1;
    const end = Math.min(this.pageIndex() * this.pageSize(), total);
    return `${start}-${end} / ${total}`;
  });

  protected readonly drawerTitle = computed(() => this.selectedUser()?.fullName || 'Chi tiết người dùng');

  protected readonly summaryItems = computed(() => {
    const user = this.selectedUser();
    if (!user) return [];
    return [
      { label: 'Mã hồ sơ', value: `${user.userId}` },
      { label: 'Email', value: this.safeValue(user.email) },
      { label: 'Điện thoại', value: this.safeValue(user.phoneNumber) },
      { label: 'Vai trò', value: this.safeValue(user.role) },
      { label: 'Chức danh', value: this.safeValue(user.positionCode) },
      { label: 'Phòng ban', value: this.safeValue(user.department) },
    ];
  });

  protected readonly mergedTrace = computed(() =>
    [...this.activityHistory(), ...this.loginHistory()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );

  protected readonly confirmTitle = computed(() => {
    switch (this.pendingAction()) {
      case 'unlock': return 'Mở khóa đăng nhập';
      case 'reset-password': return 'Reset mật khẩu';
      case 'approve': return 'Duyệt người dùng';
      case 'reactivate': return 'Kích hoạt lại người dùng';
      case 'assign-role': return 'Thay đổi vai trò';
      default: return 'Khóa đăng nhập';
    }
  });

  protected readonly confirmMessage = computed(() => {
    const name = this.selectedUser()?.fullName || 'người dùng này';
    const action = this.pendingAction();
    
    if (action === 'assign-role') {
      const currentRole = this.userRoles()[0]?.name || 'Chưa gán';
      const newRole = this.allRoles().find(r => r.id === this.pendingActionRoleId())?.name || 'mới';
      return `Bạn có chắc muốn đổi vai trò cho ${name} từ [${currentRole}] sang [${newRole}] không?`;
    }

    switch (action) {
      case 'unlock': return `Bạn có chắc muốn mở khóa đăng nhập cho ${name}?`;
      case 'reset-password': return `Bạn có chắc muốn reset mật khẩu của ${name}?`;
      case 'approve': return `Bạn có chắc muốn duyệt hồ sơ của ${name}?`;
      case 'reactivate': return `Bạn có chắc muốn kích hoạt lại ${name}?`;
      default: return `Bạn có chắc muốn khóa đăng nhập của ${name}?`;
    }
  });

  protected readonly modalTitle = computed(() => {
    switch (this.pendingModal()) {
      case 'reject': return 'Từ chối hồ sơ';
      case 'suspend': return 'Tạm dừng người dùng';
      case 'edit-profile': return 'Cập nhật hồ sơ';
      case 'assign-role': return 'Gán vai trò';
      default: return '';
    }
  });

  protected readonly assignableRoles = computed(() =>
    this.allRoles().filter((r) => !this.userRoles().find((ur) => ur.id === r.id)),
  );

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

    this.bindListTranslations();
    this.loadMetaOptions();
    this.loadUsers();
  }

  // --- Filter handlers ---
  protected onSearchChange(value: string): void { this.keyword.set(value); this.applyFilters(false); }
  protected onStatusChange(value: string): void { this.selectedStatus.set(value); this.applyFilters(); }
  protected onRoleChange(value: string): void { this.selectedRole.set(value); this.applyFilters(); }
  protected onPositionChange(value: string): void { this.selectedPosition.set(value); this.applyFilters(); }

  protected applyFilters(showLoading = true): void {
    this.pageIndex.set(1);
    this.appliedKeyword.set(this.keyword().trim());
    this.appliedStatus.set(this.selectedStatus());
    this.appliedRole.set(this.selectedRole());
    this.appliedPosition.set(this.selectedPosition());
    this.loadUsers(showLoading);
  }

  protected clearFilters(): void {
    this.keyword.set('');
    this.selectedStatus.set('');
    this.selectedRole.set('');
    this.selectedPosition.set('');
    this.appliedKeyword.set('');
    this.appliedStatus.set('');
    this.appliedRole.set('');
    this.appliedPosition.set('');
    this.pageIndex.set(1);
    this.loadUsers(false);
  }

  protected refresh(): void { this.loadUsers(); }
  protected onPageIndexChange(page: number): void { this.pageIndex.set(page); this.loadUsers(false); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.pageIndex.set(1); this.loadUsers(false); }
  protected trackUser(_index: number, row: UserListItem): UserId { return row.userId; }
  protected trackTrace(_index: number, row: UserHistoryRecord): number { return row.id; }

  // --- Drawer ---
  protected openDetail(userId: UserId): void {
    this.drawerVisible.set(true);
    this.drawerLoading.set(true);
    this.drawerTab.set('profile');
    this.selectedUser.set(null);
    this.userRoles.set([]);
    this.activityHistory.set([]);
    this.loginHistory.set([]);

    this.userManagementService.getUserById(userId)
      .pipe(finalize(() => this.drawerLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.selectedUser.set(res.data ? this.normalizeUserDetail(res.data) : null);
          this.loadTrace(userId);
          this.loadUserRoles(userId);
          if (this.allRoles().length === 0) this.loadAllRoles();
        },
        error: () => this.toastService.error('Không thể tải chi tiết người dùng'),
      });
  }

  protected closeDrawer(): void { this.drawerVisible.set(false); }

  // --- Confirm actions (no extra input) ---
  protected requestAction(action: ConfirmAction, user?: UserListItem | UserDetail | null, event?: Event): void {
    event?.stopPropagation();
    if (user) {
      if ('sysStatus' in user) {
        // Map UserListItem to a minimal UserDetail-like object for compatibility
        const item = user as UserListItem;
        this.selectedUser.set(this.normalizeUserDetail({
          userId: item.userId,
          fullName: item.fullName,
          email: item.email,
          status: item.sysStatus,
          role: item.role,
          positionCode: item.position,
        } as UserDetail));
      } else {
        this.selectedUser.set(this.normalizeUserDetail(user as UserDetail));
      }
    }
    if (!this.selectedUser()) return;
    this.pendingAction.set(action);
    this.confirmVisible.set(true);
  }

  protected cancelAction(): void { 
    this.confirmVisible.set(false); 
    this.pendingAction.set(null); 
    this.pendingActionRoleId.set(null);
  }

  protected confirmAction(): void {
    const action = this.pendingAction();
    const user = this.selectedUser();
    if (!action || !user) { this.cancelAction(); return; }

    this.confirmVisible.set(false);
    this.pendingAction.set(null);

    if (action === 'assign-role') {
      const roleId = this.pendingActionRoleId();
      this.pendingActionRoleId.set(null);
      if (!roleId) return;

      this.loadingService.showPageLoading();
      this.userManagementService.assignRoleById(user.userId, { roleId })
        .pipe(finalize(() => this.loadingService.hidePageLoading()))
        .subscribe({
          next: (res) => {
            this.userRoles.set(res.data?.roles ?? []);
            this.toastService.success('Thay đổi vai trò thành công');
            this.loadTrace(user.userId);
            this.loadUsers(false);
          },
          error: () => this.toastService.error('Không thể thay đổi vai trò'),
        });
      return;
    }

    let request$;
    switch (action) {
      case 'unlock': request$ = this.userManagementService.unlockUser(user.userId); break;
      case 'reset-password': request$ = this.userManagementService.resetPassword(user.userId); break;
      case 'approve': request$ = this.userManagementService.approveUser(user.userId); break;
      case 'reactivate': request$ = this.userManagementService.reactivateUser(user.userId); break;
      default: request$ = this.userManagementService.lockUser(user.userId);
    }

    this.loadingService.showPageLoading();
    request$
      .pipe(finalize(() => this.loadingService.hidePageLoading()))
      .subscribe({
        next: (res: any) => {
          if (res.data) this.selectedUser.set(this.normalizeUserDetail(res.data));
          this.toastService.success(this.successMessage(action as any));
          this.loadUsers(false);
          this.loadTrace(user.userId);
        },
        error: () => this.toastService.error('Không thể thực hiện thao tác'),
      });
  }

  // --- Modal actions (require additional input) ---
  protected openModal(action: ModalAction, user?: UserListItem | UserDetail | null, event?: Event): void {
    event?.stopPropagation();
    if (user) {
      if ('sysStatus' in user) {
        const item = user as UserListItem;
        this.selectedUser.set(this.normalizeUserDetail({
          userId: item.userId,
          fullName: item.fullName,
          email: item.email,
          status: item.sysStatus,
          role: item.role,
          positionCode: item.position,
        } as UserDetail));
      } else {
        this.selectedUser.set(this.normalizeUserDetail(user as UserDetail));
      }
    }
    if (!this.selectedUser()) return;
    this.pendingModal.set(action);
    this.modalReason.set('');
    this.modalReasonError.set('');

    if (action === 'edit-profile') {
      const user = this.selectedUser()!;
      this.editFullName.set(user.fullName ?? '');
      this.editPhone.set(user.phoneNumber ?? '');
      this.editPosition.set(user.positionCode ?? '');
      this.editDepartment.set(user.department ?? '');
    }

    if (action === 'assign-role') {
      this.selectedNewRoleId.set(null);
      if (this.allRoles().length === 0) this.loadAllRoles();
    }

    this.modalVisible.set(true);
  }

  protected cancelModal(): void {
    this.modalVisible.set(false);
    this.pendingModal.set(null);
  }

  protected confirmModal(): void {
    const modal = this.pendingModal();
    const user = this.selectedUser();
    if (!modal || !user) { this.cancelModal(); return; }

    if ((modal === 'reject' || modal === 'suspend') && !this.modalReason().trim()) {
      this.modalReasonError.set('Vui lòng nhập lý do');
      return;
    }

    this.modalVisible.set(false);
    this.pendingModal.set(null);
    this.loadingService.showPageLoading();

    let request$;
    switch (modal) {
      case 'reject':
        request$ = this.userManagementService.rejectUser(user.userId, { reason: this.modalReason().trim() });
        break;
      case 'suspend':
        request$ = this.userManagementService.suspendUser(user.userId, { reason: this.modalReason().trim() });
        break;
      case 'edit-profile':
        request$ = this.userManagementService.updateProfile(user.userId, {
          fullName: this.editFullName().trim() || undefined,
          phoneNumber: this.editPhone().trim() || undefined,
          positionCode: this.editPosition().trim() || undefined,
          department: this.editDepartment().trim() || undefined,
        });
        break;
      case 'assign-role': {
        const roleId = this.selectedNewRoleId();
        if (!roleId) { this.loadingService.hidePageLoading(); return; }
        this.userManagementService.assignRoleById(user.userId, { roleId })
          .pipe(finalize(() => this.loadingService.hidePageLoading()))
          .subscribe({
            next: (res) => {
              this.userRoles.set(res.data?.roles ?? []);
              this.toastService.success('Gán vai trò thành công');
              this.loadTrace(user.userId);
              this.loadUsers(false);
            },
            error: () => this.toastService.error('Không thể gán vai trò'),
          });
        return;
      }
    }

    request$!
      .pipe(finalize(() => this.loadingService.hidePageLoading()))
      .subscribe({
        next: (res) => {
          if (res.data) this.selectedUser.set(this.normalizeUserDetail(res.data));
          this.toastService.success(this.modalSuccessMessage(modal));
          this.loadUsers(false);
          this.loadTrace(user.userId);
        },
        error: () => this.toastService.error('Không thể thực hiện thao tác'),
      });
  }


  protected onRoleDirectChange(newRoleId: string): void {
    const user = this.selectedUser();
    if (!user || !newRoleId) return;
    
    const currentRoleId = this.userRoles()[0]?.id?.toString();
    if (newRoleId === currentRoleId) return;

    this.pendingActionRoleId.set(newRoleId);
    this.pendingAction.set('assign-role');
    this.confirmVisible.set(true);
  }

  // --- Status helpers ---
  protected safeValue(value?: string | null): string {
    return value && value.trim().length > 0 ? value : '-';
  }

  protected avatarFallback(name?: string | null): string {
    const normalized = `${name || ''}`.trim();
    if (!normalized) return '?';
    const parts = normalized.split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0)).join('').toUpperCase();
  }

  protected businessStatusLabel(status?: string | null): string {
    switch (`${status || ''}`.toUpperCase()) {
      case 'PENDING': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      case 'SUSPENDED': return 'Tạm dừng';
      default: return 'Chưa xác định';
    }
  }

  protected businessStatusClass(status?: string | null): string {
    switch (`${status || ''}`.toUpperCase()) {
      case 'PENDING': return 'status-chip pending';
      case 'APPROVED': return 'status-chip approved';
      case 'REJECTED': return 'status-chip rejected';
      case 'SUSPENDED': return 'status-chip suspended';
      default: return 'status-chip inactive';
    }
  }

  protected loginStatusLabel(status?: string | null): string {
    switch (`${status || ''}`.toUpperCase()) {
      case 'ACTIVE': return 'Cho phép đăng nhập';
      case 'INACTIVE': return 'Ngừng truy cập';
      case 'SUSPENDED': return 'Đã khóa đăng nhập';
      default: return 'Chưa xác định';
    }
  }

  protected loginStatusClass(status?: string | null): string {
    switch (`${status || ''}`.toUpperCase()) {
      case 'ACTIVE': return 'status-chip active';
      case 'INACTIVE': return 'status-chip inactive';
      case 'SUSPENDED': return 'status-chip locked';
      default: return 'status-chip inactive';
    }
  }

  protected isLoginLocked(): boolean {
    return `${this.selectedUser()?.loginStatus || ''}`.toUpperCase() === 'SUSPENDED';
  }

  protected canApprove(user?: UserListItem | UserDetail | null): boolean {
    const u = user || this.selectedUser();
    const status = (u as any)?.sysStatus || (u as any)?.status || '';
    return `${status}`.toUpperCase() === 'PENDING';
  }

  protected canReject(user?: UserListItem | UserDetail | null): boolean {
    const u = user || this.selectedUser();
    const status = (u as any)?.sysStatus || (u as any)?.status || '';
    return `${status}`.toUpperCase() === 'PENDING';
  }

  protected canSuspend(user?: UserListItem | UserDetail | null): boolean {
    const u = user || this.selectedUser();
    const status = (u as any)?.sysStatus || (u as any)?.status || '';
    return `${status}`.toUpperCase() === 'APPROVED';
  }

  protected canReactivate(user?: UserListItem | UserDetail | null): boolean {
    const u = user || this.selectedUser();
    const status = (u as any)?.sysStatus || (u as any)?.status || '';
    return `${status}`.toUpperCase() === 'SUSPENDED';
  }

  // --- Data loaders ---
  private loadUsers(showLoading = true): void {
    const request: UserFilterRequest = {
      keyword: this.appliedKeyword() || undefined,
      sysStatuses: this.appliedStatus() ? [this.appliedStatus()] : undefined,
      roles: this.appliedRole() ? [this.appliedRole()] : undefined,
      positions: this.appliedPosition() ? [this.appliedPosition()] : undefined,
    };

    this.isError.set(false);
    if (showLoading) { this.isLoading.set(true); this.loadingService.showPageLoading(); }

    this.userManagementService.filterUsers(request, this.pageIndex(), this.pageSize(), !showLoading)
      .pipe(finalize(() => { if (showLoading) { this.isLoading.set(false); this.loadingService.hidePageLoading(); } }))
      .subscribe({
        next: (res) => {
          const page = this.pageIndex();
          const size = this.pageSize();
          const mappedItems = (res.data?.items ?? []).map((item, index) => this.normalizeListItem({
            ...item,
            no: (page - 1) * size + index + 1,
          }));
          this.rows.set(mappedItems);
          this.totalItems.set(res.data?.totalItems ?? 0);
        },
        error: () => { this.rows.set([]); this.totalItems.set(0); this.isError.set(true); },
      });
  }

  private loadMetaOptions(): void {
    this.userManagementService.getMetaOptions().subscribe({
      next: (res) => {
        this.roleOptions.set(this.toOptions(res.data?.roles ?? [], 'Tất cả vai trò'));
        this.positionOptions.set(this.toOptions(res.data?.positions ?? [], 'Tất cả chức danh'));
      },
    });
  }

  private loadTrace(userId: UserId): void {
    this.userManagementService.getActivityHistory(userId).subscribe({
      next: (res) => this.activityHistory.set(res.data ?? []),
      error: () => this.activityHistory.set([]),
    });
    this.userManagementService.getLoginHistory(userId).subscribe({
      next: (res) => this.loginHistory.set(res.data ?? []),
      error: () => this.loginHistory.set([]),
    });
  }

  private loadUserRoles(userId: UserId): void {
    this.rolesLoading.set(true);
    this.userManagementService.getUserRoles(userId)
      .pipe(finalize(() => this.rolesLoading.set(false)))
      .subscribe({
        next: (res) => this.userRoles.set(res.data?.roles ?? []),
        error: () => this.userRoles.set([]),
      });
  }

  private loadAllRoles(): void {
    this.userManagementService.getAuthzRoles().subscribe({
      next: (res) => this.allRoles.set(res.data ?? []),
      error: () => this.allRoles.set([]),
    });
  }

  private toOptions(values: string[], allLabel: string): DropdownOption[] {
    return [{ label: allLabel, value: '' }, ...values.map((value) => ({ label: value, value }))];
  }

  private normalizeUserId(userId: UserId): string {
    return String(userId);
  }

  private normalizeListItem(item: UserListItem): UserListItem {
    return { ...item, userId: this.normalizeUserId(item.userId) };
  }

  private normalizeUserDetail(user: UserDetail): UserDetail {
    return { ...user, userId: this.normalizeUserId(user.userId) };
  }

  private bindListTranslations(): void {
    this.translateService
      .stream([
        'users.filters.searchPlaceholder',
        'users.table.no',
        'users.table.user',
        'users.table.email',
        'users.table.role',
        'users.table.position',
        'users.table.status',
        'users.filters.allStatuses',
      ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((translations) => {
        this.listSearchPlaceholder.set(translations['users.filters.searchPlaceholder']);
        this.listColumns.set([
          { ...this.baseColumns[0], label: translations['users.table.no'] },
          { ...this.baseColumns[1], label: translations['users.table.user'] },
          { ...this.baseColumns[2], label: translations['users.table.email'] },
          { ...this.baseColumns[3], label: translations['users.table.role'] },
          { ...this.baseColumns[4], label: translations['users.table.position'] },
          { ...this.baseColumns[5], label: translations['users.table.status'] },
        ]);
        this.listStatusOptions.set([
          { label: 'T\u1EA5t c\u1EA3 tr\u1EA1ng th\u00E1i', value: '' },
          { label: 'Ch\u1EDD duy\u1EC7t', value: 'PENDING' },
          { label: '\u0110\u00E3 duy\u1EC7t', value: 'APPROVED' },
          { label: 'T\u1EEB ch\u1ED1i', value: 'REJECTED' },
          { label: 'T\u1EA1m d\u1EEBng', value: 'SUSPENDED' },
        ]);
      });
  }

  private successMessage(action: ConfirmAction): string {
    switch (action) {
      case 'unlock': return 'Mở khóa đăng nhập thành công';
      case 'reset-password': return 'Reset mật khẩu thành công';
      case 'approve': return 'Duyệt người dùng thành công';
      case 'reactivate': return 'Kích hoạt lại thành công';
      case 'assign-role': return 'Thay đổi vai trò thành công';
      default: return 'Khóa đăng nhập thành công';
    }
  }

  private modalSuccessMessage(modal: ModalAction): string {
    switch (modal) {
      case 'reject': return 'Từ chối hồ sơ thành công';
      case 'suspend': return 'Tạm dừng người dùng thành công';
      case 'edit-profile': return 'Cập nhật hồ sơ thành công';
      case 'assign-role': return 'Gán vai trò thành công';
    }
  }
}



