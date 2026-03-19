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
import { ModalPopup } from '../../components/popups/modal-popup/modal-popup';
import { SharedInputTextComponent } from '../../components/shared-input-text/shared-input-text.component';
import { BreadcrumbService } from '../../services/common/breadcrumb.service';
import { LoadingService } from '../../services/common/loading.service';
import { ToastService } from '../../services/common/toast.service';
import { UserManagementService } from '../../services/api/user-management.service';
import {
  UserDetail,
  UserFilterRequest,
  UserHistoryRecord,
  UserListItem,
  UserOrganizationUpdateRequest,
  UserRoleUpdateRequest,
  UserUpsertRequest,
} from '../../models/user-management.model';

type RowConfirmAction =
  | 'lock'
  | 'unlock'
  | 'activate'
  | 'deactivate'
  | 'delete'
  | 'restore'
  | 'reset-password'
  | 'resend-activation';

type DrawerMode = 'detail' | 'activity' | 'login';
type FormMode = 'create' | 'edit' | 'role' | 'organization';

interface UserFormState {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  position: string;
  department: string;
}

const EMPTY_FORM: UserFormState = {
  fullName: '',
  email: '',
  phoneNumber: '',
  role: '',
  position: '',
  department: '',
};

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SharedSearchComponent,
    SharedDropdownComponent,
    SharedInputTextComponent,
    DataTableComponent,
    PaginationComponent,
    NoDataComponent,
    TableSkeletonComponent,
    ConfirmPopup,
    SideDrawerComponent,
    ModalPopup,
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
    { key: 'actions', label: 'users.table.actions', width: '140px', align: 'center' },
  ];

  protected readonly rows = signal<UserListItem[]>([]);
  protected readonly pageSizeOptions = [10, 20, 50];
  protected readonly totalItems = signal(0);
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

  protected readonly drawerVisible = signal(false);
  protected readonly drawerMode = signal<DrawerMode>('detail');
  protected readonly drawerLoading = signal(false);
  protected readonly selectedUser = signal<UserDetail | null>(null);
  protected readonly activityHistory = signal<UserHistoryRecord[]>([]);
  protected readonly loginHistory = signal<UserHistoryRecord[]>([]);

  protected readonly formVisible = signal(false);
  protected readonly formMode = signal<FormMode>('create');
  protected readonly editingUserId = signal<number | null>(null);
  protected readonly formState = signal<UserFormState>({ ...EMPTY_FORM });

  protected readonly confirmVisible = signal(false);
  protected readonly pendingAction = signal<RowConfirmAction | null>(null);
  protected readonly pendingUser = signal<UserListItem | null>(null);

  protected readonly actionMenuUserId = signal<number | null>(null);

  protected readonly roleOptions = signal<DropdownOption[]>([{ label: 'T\u1EA5t c\u1EA3 vai tr\u00F2', value: '' }]);
  protected readonly positionOptions = signal<DropdownOption[]>([{ label: 'T\u1EA5t c\u1EA3 ch\u1EE9c v\u1EE5', value: '' }]);
  protected readonly departmentOptions = signal<DropdownOption[]>([{ label: 'T\u1EA5t c\u1EA3 ph\u00F2ng ban', value: '' }]);

  protected readonly formRoleOptions = computed(() =>
    this.withPlaceholder(this.roleOptions(), 'Ch\u1ECDn vai tr\u00F2'),
  );

  protected readonly formPositionOptions = computed(() =>
    this.withPlaceholder(this.positionOptions(), 'Ch\u1ECDn ch\u1EE9c danh'),
  );

  protected readonly formDepartmentOptions = computed(() =>
    this.withPlaceholder(this.departmentOptions(), 'Ch\u1ECDn ph\u00F2ng ban'),
  );

  protected readonly statusOptions: DropdownOption[] = [
    { label: 'T\u1EA5t c\u1EA3 tr\u1EA1ng th\u00E1i', value: '' },
    { label: '\u0110ang ho\u1EA1t \u0111\u1ED9ng', value: 'ACTIVE' },
    { label: '\u0110\u00E3 kh\u00F3a', value: 'LOCKED' },
    { label: 'V\u00F4 hi\u1EC7u h\u00F3a', value: 'INACTIVE' },
    { label: '\u0110\u00E3 x\u00F3a', value: 'DELETED' },
  ];
  protected readonly activatedText = '\u0110\u00E3 k\u00EDch ho\u1EA1t';
  protected readonly notActivatedText = 'Ch\u01B0a k\u00EDch ho\u1EA1t';

  protected readonly displayRange = computed(() => {
    const total = this.totalItems();
    if (total === 0) {
      return '0-0 / 0';
    }
    const start = (this.pageIndex() - 1) * this.pageSize() + 1;
    const end = Math.min(this.pageIndex() * this.pageSize(), total);
    return `${start}-${end} / ${total}`;
  });

  protected readonly showPagination = computed(() => this.totalItems() > this.pageSize());
  protected readonly drawerTitle = computed(() => {
    if (this.drawerMode() === 'activity') return 'L\u1ECBch s\u1EED ho\u1EA1t \u0111\u1ED9ng';
    if (this.drawerMode() === 'login') return 'L\u1ECBch s\u1EED \u0111\u0103ng nh\u1EADp';
    return 'Chi ti\u1EBFt ng\u01B0\u1EDDi d\u00F9ng';
  });

  protected readonly formTitle = computed(() => {
    switch (this.formMode()) {
      case 'create':
        return 'T\u1EA1o m\u1EDBi user';
      case 'edit':
        return 'Ch\u1EC9nh s\u1EEDa user';
      case 'role':
        return 'G\u00E1n / \u0111\u1ED5i vai tr\u00F2';
      case 'organization':
        return 'C\u1EADp nh\u1EADt ch\u1EE9c danh / ph\u00F2ng ban';
    }
  });

  protected readonly confirmTitle = computed(() => {
    switch (this.pendingAction()) {
      case 'lock':
        return 'Kh\u00F3a t\u00E0i kho\u1EA3n';
      case 'unlock':
        return 'M\u1EDF kh\u00F3a t\u00E0i kho\u1EA3n';
      case 'activate':
        return 'K\u00EDch ho\u1EA1t t\u00E0i kho\u1EA3n';
      case 'deactivate':
        return 'V\u00F4 hi\u1EC7u h\u00F3a t\u00E0i kho\u1EA3n';
      case 'delete':
        return 'X\u00F3a t\u00E0i kho\u1EA3n';
      case 'restore':
        return 'Kh\u00F4i ph\u1EE5c t\u00E0i kho\u1EA3n';
      case 'reset-password':
        return 'Reset m\u1EADt kh\u1EA9u';
      case 'resend-activation':
        return 'G\u1EEDi l\u1EA1i email k\u00EDch ho\u1EA1t';
      default:
        return 'X\u00E1c nh\u1EADn thao t\u00E1c';
    }
  });

  protected readonly confirmMessage = computed(() => {
    const userName = this.pendingUser()?.fullName || 'ng\u01B0\u1EDDi d\u00F9ng n\u00E0y';
    switch (this.pendingAction()) {
      case 'lock':
        return `B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n kh\u00F3a ${userName}?`;
      case 'unlock':
        return `B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n m\u1EDF kh\u00F3a ${userName}?`;
      case 'activate':
        return `B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n k\u00EDch ho\u1EA1t ${userName}?`;
      case 'deactivate':
        return `B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n v\u00F4 hi\u1EC7u h\u00F3a ${userName}?`;
      case 'delete':
        return `B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n x\u00F3a ${userName}?`;
      case 'restore':
        return `B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n kh\u00F4i ph\u1EE5c ${userName}?`;
      case 'reset-password':
        return `B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n reset m\u1EADt kh\u1EA9u c\u1EE7a ${userName}?`;
      case 'resend-activation':
        return `B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n g\u1EEDi l\u1EA1i email k\u00EDch ho\u1EA1t cho ${userName}?`;
      default:
        return 'X\u00E1c nh\u1EADn thao t\u00E1c.';
    }
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
    if (!normalized) {
      return '?';
    }
    const [first = '', second = ''] = normalized.split(/\s+/);
    return `${first.charAt(0)}${second.charAt(0)}`.trim().toUpperCase() || normalized.charAt(0).toUpperCase();
  }

  protected statusLabel(status?: string | null): string {
    const normalized = `${status || ''}`.toUpperCase();
    if (normalized === 'LOCKED') return '\u0110\u00E3 kh\u00F3a';
    if (normalized === 'INACTIVE') return 'V\u00F4 hi\u1EC7u h\u00F3a';
    if (normalized === 'DELETED') return '\u0110\u00E3 x\u00F3a';
    return '\u0110ang ho\u1EA1t \u0111\u1ED9ng';
  }

  protected statusClass(status?: string | null): string {
    const normalized = `${status || ''}`.toUpperCase();
    if (normalized === 'LOCKED') return 'status-chip locked';
    if (normalized === 'INACTIVE') return 'status-chip inactive';
    if (normalized === 'DELETED') return 'status-chip deleted';
    return 'status-chip active';
  }

  protected toggleActionMenu(userId: number, event: Event): void {
    event.stopPropagation();
    this.actionMenuUserId.set(this.actionMenuUserId() === userId ? null : userId);
  }

  protected closeActionMenu(): void {
    this.actionMenuUserId.set(null);
  }

  protected openCreateModal(): void {
    this.formMode.set('create');
    this.editingUserId.set(null);
    this.formState.set({ ...EMPTY_FORM });
    this.formVisible.set(true);
  }

  protected openEditModal(user: UserListItem, event?: Event): void {
    event?.stopPropagation();
    this.formMode.set('edit');
    this.editingUserId.set(user.userId);
    this.prefillFormFromUser(user.userId);
    this.formVisible.set(true);
    this.closeActionMenu();
  }

  protected openRoleModal(user: UserListItem, event?: Event): void {
    event?.stopPropagation();
    this.formMode.set('role');
    this.editingUserId.set(user.userId);
    this.prefillFormFromUser(user.userId);
    this.formVisible.set(true);
    this.closeActionMenu();
  }

  protected openOrganizationModal(user: UserListItem, event?: Event): void {
    event?.stopPropagation();
    this.formMode.set('organization');
    this.editingUserId.set(user.userId);
    this.prefillFormFromUser(user.userId);
    this.formVisible.set(true);
    this.closeActionMenu();
  }

  protected closeForm(): void {
    this.formVisible.set(false);
  }

  protected updateFormField<K extends keyof UserFormState>(key: K, value: UserFormState[K]): void {
    this.formState.update((state) => ({ ...state, [key]: value }));
  }

  protected saveForm(): void {
    const mode = this.formMode();
    const userId = this.editingUserId();
    const state = this.formState();

    if (mode === 'create' || mode === 'edit') {
      const payload: UserUpsertRequest = {
        fullName: state.fullName,
        email: state.email,
        phoneNumber: state.phoneNumber,
        role: state.role,
        position: state.position,
        department: state.department,
      };

      const request$ = mode === 'create'
        ? this.userManagementService.createUser(payload)
        : this.userManagementService.updateUser(userId!, payload);

      request$.subscribe({
        next: () => {
          this.toastService.success(mode === 'create' ? 'T\u1EA1o m\u1EDBi user th\u00E0nh c\u00F4ng' : 'C\u1EADp nh\u1EADt user th\u00E0nh c\u00F4ng');
          this.closeForm();
          this.loadMetaOptions();
          this.loadUsers(false);
        },
        error: () => this.toastService.error('Kh\u00F4ng th\u1EC3 l\u01B0u th\u00F4ng tin user'),
      });
      return;
    }

    if (!userId) {
      return;
    }

    if (mode === 'role') {
      const payload: UserRoleUpdateRequest = { role: state.role };
      this.userManagementService.assignRole(userId, payload).subscribe({
        next: () => {
          this.toastService.success('C\u1EADp nh\u1EADt vai tr\u00F2 th\u00E0nh c\u00F4ng');
          this.closeForm();
          this.loadMetaOptions();
          this.loadUsers(false);
        },
        error: () => this.toastService.error('Kh\u00F4ng th\u1EC3 c\u1EADp nh\u1EADt vai tr\u00F2'),
      });
      return;
    }

    const payload: UserOrganizationUpdateRequest = {
      position: state.position,
      department: state.department,
    };
    this.userManagementService.updateOrganization(userId, payload).subscribe({
      next: () => {
        this.toastService.success('C\u1EADp nh\u1EADt ch\u1EE9c danh / ph\u00F2ng ban th\u00E0nh c\u00F4ng');
        this.closeForm();
        this.loadMetaOptions();
        this.loadUsers(false);
      },
      error: () => this.toastService.error('Kh\u00F4ng th\u1EC3 c\u1EADp nh\u1EADt ch\u1EE9c danh / ph\u00F2ng ban'),
    });
  }

  protected openUserDetail(userId: number): void {
    this.drawerMode.set('detail');
    this.drawerVisible.set(true);
    this.drawerLoading.set(true);
    this.selectedUser.set(null);
    this.userManagementService.getUserById(userId)
      .pipe(finalize(() => this.drawerLoading.set(false)))
      .subscribe({
        next: (res) => this.selectedUser.set(res.data ?? null),
        error: () => this.toastService.error('Kh\u00F4ng th\u1EC3 t\u1EA3i chi ti\u1EBFt ng\u01B0\u1EDDi d\u00F9ng'),
      });
  }

  protected openHistory(user: UserListItem, mode: DrawerMode, event?: Event): void {
    event?.stopPropagation();
    this.drawerMode.set(mode);
    this.drawerVisible.set(true);
    this.drawerLoading.set(true);
    this.activityHistory.set([]);
    this.loginHistory.set([]);
    this.selectedUser.set(null);
    this.userManagementService.getUserById(user.userId).subscribe({
      next: (res) => this.selectedUser.set(res.data ?? null),
    });
    const request$ = mode === 'activity'
      ? this.userManagementService.getActivityHistory(user.userId)
      : this.userManagementService.getLoginHistory(user.userId);
    request$
      .pipe(finalize(() => this.drawerLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (mode === 'activity') {
            this.activityHistory.set(res.data ?? []);
          } else {
            this.loginHistory.set(res.data ?? []);
          }
        },
        error: () => this.toastService.error('Kh\u00F4ng th\u1EC3 t\u1EA3i l\u1ECBch s\u1EED'),
      });
    this.closeActionMenu();
  }

  protected closeDrawer(): void {
    this.drawerVisible.set(false);
  }

  protected requestAction(user: UserListItem, action: RowConfirmAction, event?: Event): void {
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

    const request$ = this.resolveActionRequest(user.userId, action);
    this.confirmVisible.set(false);
    request$.subscribe({
      next: (res) => {
        if (this.selectedUser()?.userId === user.userId) {
          this.selectedUser.set(res.data ?? null);
        }
        this.toastService.success(this.successMessage(action));
        this.loadUsers(false);
      },
      error: () => this.toastService.error('Kh\u00F4ng th\u1EC3 th\u1EF1c hi\u1EC7n thao t\u00E1c'),
    });

    this.pendingUser.set(null);
    this.pendingAction.set(null);
  }

  protected isDeleted(user: UserListItem): boolean {
    return `${user.sysStatus || ''}`.toUpperCase() === 'DELETED';
  }

  protected isInactive(user: UserListItem): boolean {
    return `${user.sysStatus || ''}`.toUpperCase() === 'INACTIVE';
  }

  protected isLocked(user: UserListItem | string | null | undefined): boolean {
    const status = typeof user === 'string' ? user : user?.sysStatus;
    return `${status || ''}`.toUpperCase() === 'LOCKED';
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
          this.updateDynamicFilterOptions(res.data?.items ?? []);
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
        const data = res.data;
        this.roleOptions.set(this.mapMetaOptions(data?.roles ?? [], 'T\u1EA5t c\u1EA3 vai tr\u00F2'));
        this.positionOptions.set(this.mapMetaOptions(data?.positions ?? [], 'T\u1EA5t c\u1EA3 ch\u1EE9c v\u1EE5'));
        this.departmentOptions.set(this.mapMetaOptions(data?.departments ?? [], 'T\u1EA5t c\u1EA3 ph\u00F2ng ban'));
      },
    });
  }

  private prefillFormFromUser(userId: number): void {
    this.userManagementService.getUserById(userId).subscribe({
      next: (res) => {
        const user = res.data;
        this.formState.set({
          fullName: user?.fullName || '',
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || '',
          role: user?.role || '',
          position: user?.positionCode || '',
          department: user?.department || '',
        });
      },
    });
  }

  private mapMetaOptions(values: string[], allLabel: string): DropdownOption[] {
    return [{ label: allLabel, value: '' }, ...values.map((value) => ({ label: value, value }))];
  }

  private withPlaceholder(options: DropdownOption[], placeholder: string): DropdownOption[] {
    return [{ label: placeholder, value: '' }, ...options.filter((opt) => opt.value !== '')];
  }

  private updateDynamicFilterOptions(items: UserListItem[]): void {
    this.roleOptions.set(this.toDynamicOptions(items.map((item) => item.role), 'T\u1EA5t c\u1EA3 vai tr\u00F2', this.selectedRole()));
    this.positionOptions.set(this.toDynamicOptions(items.map((item) => item.position), 'T\u1EA5t c\u1EA3 ch\u1EE9c v\u1EE5', this.selectedPosition()));
  }

  private toDynamicOptions(values: Array<string | undefined>, allLabel: string, selectedValue = ''): DropdownOption[] {
    const uniqueValues = Array.from(new Set(values.map((value) => `${value || ''}`.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    if (selectedValue && !uniqueValues.includes(selectedValue)) {
      uniqueValues.unshift(selectedValue);
    }
    return [{ label: allLabel, value: '' }, ...uniqueValues.map((value) => ({ label: value, value }))];
  }

  private resolveActionRequest(userId: number, action: RowConfirmAction) {
    switch (action) {
      case 'lock':
        return this.userManagementService.lockUser(userId);
      case 'unlock':
        return this.userManagementService.unlockUser(userId);
      case 'activate':
        return this.userManagementService.activateUser(userId);
      case 'deactivate':
        return this.userManagementService.deactivateUser(userId);
      case 'delete':
        return this.userManagementService.deleteUser(userId);
      case 'restore':
        return this.userManagementService.restoreUser(userId);
      case 'reset-password':
        return this.userManagementService.resetPassword(userId);
      case 'resend-activation':
        return this.userManagementService.resendActivationEmail(userId);
    }
  }

  private successMessage(action: RowConfirmAction): string {
    switch (action) {
      case 'lock':
        return 'Kh\u00F3a t\u00E0i kho\u1EA3n th\u00E0nh c\u00F4ng';
      case 'unlock':
        return 'M\u1EDF kh\u00F3a t\u00E0i kho\u1EA3n th\u00E0nh c\u00F4ng';
      case 'activate':
        return 'K\u00EDch ho\u1EA1t t\u00E0i kho\u1EA3n th\u00E0nh c\u00F4ng';
      case 'deactivate':
        return 'V\u00F4 hi\u1EC7u h\u00F3a t\u00E0i kho\u1EA3n th\u00E0nh c\u00F4ng';
      case 'delete':
        return 'X\u00F3a t\u00E0i kho\u1EA3n th\u00E0nh c\u00F4ng';
      case 'restore':
        return 'Kh\u00F4i ph\u1EE5c t\u00E0i kho\u1EA3n th\u00E0nh c\u00F4ng';
      case 'reset-password':
        return 'Reset m\u1EADt kh\u1EA9u th\u00E0nh c\u00F4ng';
      case 'resend-activation':
        return '\u0110\u00E3 g\u1EEDi l\u1EA1i email k\u00EDch ho\u1EA1t';
    }
  }
}

