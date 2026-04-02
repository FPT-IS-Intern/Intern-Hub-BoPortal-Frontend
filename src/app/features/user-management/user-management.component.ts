import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { finalize, Observable } from 'rxjs';
import { DataTableColumn, DataTableComponent } from '@/components/data-table/data-table.component';
import { DropdownOption, DropdownValue, SharedDropdownComponent } from '@/components/shared-dropdown/shared-dropdown.component';
import { SharedSearchComponent } from '@/components/shared-search/shared-search.component';
import { PaginationComponent } from '@/components/pagination/pagination.component';
import { NoDataComponent } from '@/components/no-data/no-data.component';
import { TableSkeletonComponent } from '@/components/skeletons/table-skeleton/table-skeleton.component';
import {
  TableBodySkeletonCell,
  TableBodySkeletonComponent,
} from '@/components/skeletons/table-body-skeleton/table-body-skeleton.component';
import { UserDrawerSkeletonComponent } from '@/components/skeletons/user-drawer-skeleton/user-drawer-skeleton.component';
import { ConfirmPopup } from '@/components/popups/confirm-popup/confirm-popup';
import { SideDrawerComponent } from '@/components/popups/side-drawer/side-drawer.component';
import { TooltipDirective } from '@/directives/tooltip.directive';
import { BreadcrumbService } from '@/services/common/breadcrumb.service';
import { LoadingService } from '@/services/common/loading.service';
import { ToastService } from '@/services/common/toast.service';
import { UserManagementService } from '@/services/api/user-management.service';
import { AuditService } from '@/services/api/audit.service';
import { AuditItemResponse } from '@/models/audit-log.model';
import {
  AuthzRole,
  UserDetail,
  UserFilterRequest,
  UserHistoryRecord,
  UserId,
  UserListItem,
  UserSummary,
  UserSystemStatus,
} from '@/models/user-management.model';

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
    TableBodySkeletonComponent,
    UserDrawerSkeletonComponent,
    ConfirmPopup,
    SideDrawerComponent,
    TooltipDirective,
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
  private readonly router = inject(Router);
  private readonly auditService = inject(AuditService);
  private readonly destroyRef = inject(DestroyRef);

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
  protected readonly isFiltering = signal(false);
  protected readonly isError = signal(false);

  protected readonly drawerVisible = signal(false);
  protected readonly drawerLoading = signal(false);
  protected readonly drawerTab = signal<DrawerTab>('profile');
  protected readonly selectedUser = signal<UserDetail | null>(null);
  protected readonly activityHistory = signal<UserHistoryRecord[]>([]);
  protected readonly loginHistory = signal<UserHistoryRecord[]>([]);
  protected readonly recentAuditLogs = signal<AuditItemResponse[]>([]);
  protected readonly auditLogsLoading = signal(false);

  protected readonly userRoles = signal<AuthzRole[]>([]);
  protected readonly allRoles = signal<AuthzRole[]>([]);
  protected readonly rolesLoading = signal(false);
  protected readonly roleChangeOptions = computed<DropdownOption[]>(() =>
    this.allRoles().map((r) => ({ label: r.name, value: r.id.toString() })),
  );

  protected readonly confirmVisible = signal(false);
  protected readonly pendingAction = signal<ConfirmAction | null>(null);
  protected readonly pendingActionRoleId = signal<string | null>(null);

  protected readonly modalVisible = signal(false);
  protected readonly pendingModal = signal<ModalAction | null>(null);
  protected readonly modalReason = signal('');
  protected readonly modalReasonError = signal('');

  protected readonly editFullName = signal('');
  protected readonly editPhone = signal('');
  protected readonly editPosition = signal('');
  protected readonly editDepartment = signal('');

  protected readonly selectedNewRoleId = signal<string | null>(null);
  protected readonly listColumns = signal<DataTableColumn[]>(this.baseColumns);
  protected readonly listSearchPlaceholder = signal('');
  protected readonly listStatusOptions = signal<DropdownOption[]>([]);

  protected readonly metaRoles = signal<string[]>([]);
  protected readonly metaPositions = signal<string[]>([]);
  protected readonly allRolesLabel = signal('');
  protected readonly allPositionsLabel = signal('');
  protected readonly roleOptions = computed<DropdownOption[]>(() =>
    this.toOptions(this.metaRoles(), this.allRolesLabel()),
  );
  protected readonly positionOptions = computed<DropdownOption[]>(() =>
    this.toOptions(this.metaPositions(), this.allPositionsLabel()),
  );
  protected readonly filterSkeletonRows = computed(() => Array.from({ length: 5 }, (_, index) => index));
  protected readonly filterSkeletonCells = computed<TableBodySkeletonCell[]>(() =>
    this.baseColumns.map((column) => {
      switch (column.key) {
        case 'no':
          return {
            columnWidth: column.width,
            columnMinWidth: column.minWidth,
            width: '100%',
            align: column.align === 'center' ? 'center' : 'start',
          };
        case 'user':
          return {
            columnWidth: column.width,
            columnMinWidth: column.minWidth,
            width: '100%',
            height: '42px',
            radius: '12px',
          };
        case 'sysStatus':
          return {
            columnWidth: column.width,
            columnMinWidth: column.minWidth,
            width: '100%',
            height: '26px',
            radius: '999px',
            align: column.align === 'center' ? 'center' : 'end',
          };
        default:
          return {
            columnWidth: column.width,
            columnMinWidth: column.minWidth,
            width: '100%',
            align: column.align === 'center' ? 'center' : 'start',
          };
      }
    }),
  );

  protected readonly displayRange = computed(() => {
    const total = this.totalItems();
    if (total === 0) return '0-0 / 0';
    const start = (this.pageIndex() - 1) * this.pageSize() + 1;
    const end = Math.min(this.pageIndex() * this.pageSize(), total);
    return `${start}-${end} / ${total}`;
  });

  protected readonly drawerTitle = computed(() =>
    this.selectedUser()?.fullName || this.translateService.instant('users.detail.title'),
  );

  protected readonly summaryItems = computed(() => {
    const user = this.selectedUser();
    if (!user) return [];
    const labels = this.translateService.instant([
      'users.detail.userId',
      'users.detail.email',
      'users.detail.phone',
      'users.detail.role',
      'users.detail.position',
      'users.detail.department',
      'users.detail.mentor',
    ]) as Record<string, string>;
    return [
      { label: labels['users.detail.userId'], value: `${user.userId}` },
      { label: labels['users.detail.email'], value: this.safeValue(user.email) },
      { label: labels['users.detail.phone'], value: this.safeValue(user.phoneNumber) },
      { label: labels['users.detail.role'], value: this.safeValue(user.role) },
      { label: labels['users.detail.position'], value: this.safeValue(user.positionCode) },
      { label: labels['users.detail.department'], value: this.safeValue(user.department) },
      { label: labels['users.detail.mentor'], value: this.safeValue(this.resolveMentorName(user)) },
    ];
  });

  protected readonly mergedTrace = computed(() =>
    [...this.activityHistory(), ...this.loginHistory()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );

  protected readonly confirmTitle = computed(() => {
    switch (this.pendingAction()) {
      case 'unlock': return this.translateService.instant('users.confirm.unlockTitle');
      case 'reset-password': return this.translateService.instant('users.confirm.resetPasswordTitle');
      case 'approve': return this.translateService.instant('users.confirm.approveTitle');
      case 'reactivate': return this.translateService.instant('users.confirm.reactivateTitle');
      case 'assign-role': return this.translateService.instant('users.confirm.assignRoleTitle');
      default: return this.translateService.instant('users.confirm.lockTitle');
    }
  });

  protected readonly confirmMessage = computed(() => {
    const name = this.selectedUser()?.fullName || this.translateService.instant('users.common.thisUser');
    const action = this.pendingAction();

    if (action === 'assign-role') {
      const currentRole = this.userRoles()[0]?.name || this.translateService.instant('users.detail.access.unassigned');
      const newRole = this.allRoles().find((r) => r.id.toString() === this.pendingActionRoleId())?.name
        || this.translateService.instant('users.common.newRole');
      return this.translateService.instant('users.confirm.assignRoleMessage', {
        name,
        currentRole,
        newRole,
      });
    }

    switch (action) {
      case 'unlock':
        return this.translateService.instant('users.confirm.unlockMessage', { name });
      case 'reset-password':
        return this.translateService.instant('users.confirm.resetPasswordMessage', { name });
      case 'approve':
        return this.translateService.instant('users.confirm.approveMessage', { name });
      case 'reactivate':
        return this.translateService.instant('users.confirm.reactivateMessage', { name });
      default:
        return this.translateService.instant('users.confirm.lockMessage', { name });
    }
  });

  protected readonly modalTitle = computed(() => {
    switch (this.pendingModal()) {
      case 'reject': return this.translateService.instant('users.modal.rejectTitle');
      case 'suspend': return this.translateService.instant('users.modal.suspendTitle');
      case 'edit-profile': return this.translateService.instant('users.modal.editProfileTitle');
      case 'assign-role': return this.translateService.instant('users.modal.assignRoleTitle');
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

  protected onSearchChange(value: string): void { this.keyword.set(value); this.applyFilters(false); }
  protected onStatusChange(value: DropdownValue): void { this.selectedStatus.set(this.toDropdownString(value)); this.applyFilters(false); }
  protected onRoleChange(value: DropdownValue): void { this.selectedRole.set(this.toDropdownString(value)); this.applyFilters(false); }
  protected onPositionChange(value: DropdownValue): void { this.selectedPosition.set(this.toDropdownString(value)); this.applyFilters(false); }

  protected applyFilters(showLoading = true): void {
    this.pageIndex.set(1);
    this.appliedKeyword.set(this.keyword().trim());
    this.appliedStatus.set(this.selectedStatus());
    this.appliedRole.set(this.selectedRole());
    this.appliedPosition.set(this.selectedPosition());
    this.loadUsers({ showPageLoading: showLoading, showTableOverlay: !showLoading });
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
    this.loadUsers({ showTableOverlay: true });
  }

  protected refresh(): void { this.loadUsers(); }
  protected onPageIndexChange(page: number): void { this.pageIndex.set(page); this.loadUsers({ showTableOverlay: true }); }
  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadUsers({ showTableOverlay: true });
  }
  protected trackUser(_index: number, row: UserListItem): UserId { return row.userId; }
  protected trackTrace(_index: number, row: UserHistoryRecord): number { return row.id; }

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
          this.loadRecentAuditLogs(userId);
          this.loadUserRoles(userId);
          if (this.allRoles().length === 0) this.loadAllRoles();
        },
        error: () => this.toastService.error(this.translateService.instant('users.toast.loadDetailError')),
      });
  }

  protected closeDrawer(): void { this.drawerVisible.set(false); }

  protected openAuditLogForCurrentUser(): void {
    const userId = this.selectedUser()?.userId;
    if (!userId) {
      return;
    }
    this.drawerVisible.set(false);
    this.router.navigate(['/audit-log'], { queryParams: { actorId: userId } });
  }

  protected requestAction(action: ConfirmAction, user?: UserListItem | UserDetail | null, event?: Event): void {
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
            const assignedRoles = res.data?.roles ?? [];
            this.userRoles.set(assignedRoles);
            this.applyAssignedRoleToCurrentUser(assignedRoles);
            this.toastService.success(this.translateService.instant('users.toast.assignRoleSuccess'));
            this.loadTrace(user.userId);
            this.loadUsers({ showTableOverlay: false });
          },
          error: () => this.toastService.error(this.translateService.instant('users.toast.assignRoleError')),
        });
      return;
    }

    let request$!: Observable<ResponseApi<UserDetail>>;
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
        next: (res) => {
          if (res.data) this.selectedUser.set(this.normalizeUserDetail(res.data));
          this.toastService.success(this.successMessage(action));
          this.loadUsers({ showTableOverlay: false });
          this.loadTrace(user.userId);
        },
        error: () => this.toastService.error(this.translateService.instant('users.toast.actionError')),
      });
  }

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
      const currentUser = this.selectedUser()!;
      this.editFullName.set(currentUser.fullName ?? '');
      this.editPhone.set(currentUser.phoneNumber ?? '');
      this.editPosition.set(currentUser.positionCode ?? '');
      this.editDepartment.set(currentUser.department ?? '');
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
      this.modalReasonError.set(this.translateService.instant('users.modal.reasonRequired'));
      return;
    }

    this.modalVisible.set(false);
    this.pendingModal.set(null);
    this.loadingService.showPageLoading();

    let request$!: Observable<ResponseApi<UserDetail>>;
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
              const assignedRoles = res.data?.roles ?? [];
              this.userRoles.set(assignedRoles);
              this.applyAssignedRoleToCurrentUser(assignedRoles);
              this.toastService.success(this.translateService.instant('users.toast.assignRoleSuccess'));
              this.loadTrace(user.userId);
              this.loadUsers({ showTableOverlay: false });
            },
            error: () => this.toastService.error(this.translateService.instant('users.toast.assignRoleError')),
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
          this.loadUsers({ showTableOverlay: false });
          this.loadTrace(user.userId);
        },
        error: () => this.toastService.error(this.translateService.instant('users.toast.actionError')),
      });
  }

  protected onRoleDirectChange(newRoleId: DropdownValue): void {
    const user = this.selectedUser();
    const normalizedRoleId = this.toDropdownString(newRoleId);
    if (!user || !normalizedRoleId) return;

    const currentRoleId = this.userRoles()[0]?.id?.toString();
    if (normalizedRoleId === currentRoleId) return;

    this.pendingActionRoleId.set(normalizedRoleId);
    this.pendingAction.set('assign-role');
    this.confirmVisible.set(true);
  }

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
      case 'ACTIVE': return this.translateService.instant('users.status.active');
      case 'INACTIVE': return this.translateService.instant('users.status.inactive');
      case 'PENDING': return this.translateService.instant('users.status.pending');
      case 'APPROVED': return this.translateService.instant('users.status.approved');
      case 'REJECTED': return this.translateService.instant('users.status.rejected');
      case 'SUSPENDED': return this.translateService.instant('users.status.suspended');
      default: return this.translateService.instant('users.status.unknown');
    }
  }

  protected businessStatusClass(status?: string | null): string {
    switch (`${status || ''}`.toUpperCase()) {
      case 'ACTIVE': return 'status-chip active';
      case 'INACTIVE': return 'status-chip inactive';
      case 'PENDING': return 'status-chip pending';
      case 'APPROVED': return 'status-chip approved';
      case 'REJECTED': return 'status-chip rejected';
      case 'SUSPENDED': return 'status-chip suspended';
      default: return 'status-chip inactive';
    }
  }

  protected loginStatusLabel(status?: string | null): string {
    switch (`${status || ''}`.toUpperCase()) {
      case 'ACTIVE': return this.translateService.instant('users.loginStatus.active');
      case 'INACTIVE': return this.translateService.instant('users.loginStatus.inactive');
      case 'SUSPENDED': return this.translateService.instant('users.loginStatus.suspended');
      default: return this.translateService.instant('users.loginStatus.unknown');
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
    return this.currentAuthStatus() === 'SUSPENDED';
  }

  protected canApprove(user?: UserListItem | UserDetail | null): boolean {
    return this.getUserSystemStatus(user || this.selectedUser()) === 'INACTIVE';
  }

  protected canReject(user?: UserListItem | UserDetail | null): boolean {
    return this.getUserSystemStatus(user || this.selectedUser()) !== 'INACTIVE';
  }

  protected canSuspend(user?: UserListItem | UserDetail | null): boolean {
    return this.getUserSystemStatus(user || this.selectedUser()) === 'ACTIVE';
  }

  protected canReactivate(user?: UserListItem | UserDetail | null): boolean {
    return this.getUserSystemStatus(user || this.selectedUser()) === 'SUSPENDED';
  }

  protected trackRecentAudit(index: number, row: AuditItemResponse): string {
    return `${row.id}-${row.timeStamp}-${index}`;
  }

  private loadUsers(options: { showPageLoading?: boolean; showTableOverlay?: boolean } = {}): void {
    const showPageLoading = options.showPageLoading ?? true;
    const showTableOverlay = options.showTableOverlay ?? false;
    const request: UserFilterRequest = {
      keyword: this.appliedKeyword() || undefined,
      sysStatuses: this.appliedStatus() ? [this.appliedStatus() as UserSystemStatus] : undefined,
      roles: this.appliedRole() ? [this.appliedRole()] : undefined,
      positions: this.appliedPosition() ? [this.appliedPosition()] : undefined,
    };

    this.isError.set(false);
    if (showPageLoading) {
      this.isLoading.set(true);
      this.loadingService.showPageLoading();
      this.isFiltering.set(false);
    } else if (showTableOverlay) {
      this.isFiltering.set(true);
    }

    this.userManagementService.filterUsers(request, this.pageIndex(), this.pageSize(), !showPageLoading)
      .pipe(finalize(() => {
        if (showPageLoading) {
          this.isLoading.set(false);
          this.loadingService.hidePageLoading();
        }
        if (showTableOverlay) {
          this.isFiltering.set(false);
        }
      }))
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
        this.metaRoles.set(res.data?.roles ?? []);
        this.metaPositions.set(res.data?.positions ?? []);
      },
      error: () => {
        this.metaRoles.set([]);
        this.metaPositions.set([]);
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

  private loadRecentAuditLogs(userId: UserId): void {
    this.auditLogsLoading.set(true);
    this.auditService.queryAudits({
      page: 0,
      size: 10,
      actorIds: [String(userId)],
    })
      .pipe(finalize(() => this.auditLogsLoading.set(false)))
      .subscribe({
        next: (res) => this.recentAuditLogs.set(res.data?.content ?? []),
        error: () => this.recentAuditLogs.set([]),
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

  private toDropdownString(value: DropdownValue): string {
    return value == null ? '' : String(value);
  }

  private normalizeUserId(userId: UserId): string {
    return String(userId);
  }

  private normalizeListItem(item: UserListItem): UserListItem {
    return { ...item, userId: this.normalizeUserId(item.userId) };
  }

  private normalizeUserDetail(user: UserDetail): UserDetail {
    const rawUser = user as UserDetail & {
      mentor_id?: string | number | null;
      mentor_name?: string | null;
      mentor?: {
        id?: string | number;
        user_id?: string | number;
        userId?: string | number;
        full_name?: string;
        fullName?: string;
        name?: string;
        email?: string;
      } | null;
    };

    const rawMentor = rawUser.mentor;
    const normalizedMentor = rawMentor
      ? {
        id: rawMentor.id,
        userId: rawMentor.userId ?? rawMentor.user_id,
        fullName: rawMentor.fullName ?? rawMentor.full_name,
        name: rawMentor.name,
        email: rawMentor.email,
      }
      : null;

    return {
      ...user,
      userId: this.normalizeUserId(user.userId),
      mentorId: user.mentorId ?? rawUser.mentor_id ?? normalizedMentor?.userId ?? normalizedMentor?.id,
      mentorName: user.mentorName ?? rawUser.mentor_name ?? normalizedMentor?.fullName ?? normalizedMentor?.name,
      mentor: normalizedMentor,
    };
  }

  private resolveMentorName(user: UserDetail): string {
    if (user.mentorName?.trim()) {
      return user.mentorName.trim();
    }
    if (user.mentor?.fullName?.trim()) {
      return user.mentor.fullName.trim();
    }
    if (user.mentor?.name?.trim()) {
      return user.mentor.name.trim();
    }
    if (user.mentor?.email?.trim()) {
      return user.mentor.email.trim();
    }
    return '';
  }

  protected currentAuthStatus(): string {
    return this.getUserSystemStatus(this.selectedUser());
  }

  private getUserSystemStatus(user?: UserSummary | null): string {
    if (!user) {
      return '';
    }

    const status = 'status' in user
      ? (user.loginStatus || user.status)
      : ('sysStatus' in user ? user.sysStatus : undefined);
    return `${status || ''}`.toUpperCase();
  }

  private applyAssignedRoleToCurrentUser(roles: AuthzRole[]): void {
    const selectedUser = this.selectedUser();
    const nextRoleName = roles[0]?.name ?? '';

    if (!selectedUser || !nextRoleName) {
      return;
    }

    this.selectedUser.set({
      ...selectedUser,
      role: nextRoleName,
    });

    this.rows.update((rows) =>
      rows.map((row) =>
        row.userId === selectedUser.userId
          ? { ...row, role: nextRoleName }
          : row,
      ),
    );
  }

  private bindListTranslations(): void {
    this.translateService
      .stream([
        'users.filters.searchPlaceholder',
        'users.filters.allRoles',
        'users.filters.allPositions',
        'users.filters.allStatuses',
        'users.table.no',
        'users.table.user',
        'users.table.email',
        'users.table.role',
        'users.table.position',
        'users.table.status',
        'users.status.active',
        'users.status.inactive',
        'users.status.suspended',
      ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((translations) => {
        this.listSearchPlaceholder.set(translations['users.filters.searchPlaceholder']);
        this.allRolesLabel.set(translations['users.filters.allRoles']);
        this.allPositionsLabel.set(translations['users.filters.allPositions']);
        this.listColumns.set([
          { ...this.baseColumns[0], label: translations['users.table.no'] },
          { ...this.baseColumns[1], label: translations['users.table.user'] },
          { ...this.baseColumns[2], label: translations['users.table.email'] },
          { ...this.baseColumns[3], label: translations['users.table.role'] },
          { ...this.baseColumns[4], label: translations['users.table.position'] },
          { ...this.baseColumns[5], label: translations['users.table.status'] },
        ]);
        this.listStatusOptions.set([
          { label: translations['users.filters.allStatuses'], value: '' },
          { label: translations['users.status.active'], value: 'ACTIVE' },
          { label: translations['users.status.inactive'], value: 'INACTIVE' },
          { label: translations['users.status.suspended'], value: 'SUSPENDED' },
        ]);
      });
  }

  private successMessage(action: ConfirmAction): string {
    switch (action) {
      case 'unlock': return this.translateService.instant('users.toast.unlockSuccess');
      case 'reset-password': return this.translateService.instant('users.toast.resetPasswordSuccess');
      case 'approve': return this.translateService.instant('users.toast.approveSuccess');
      case 'reactivate': return this.translateService.instant('users.toast.reactivateSuccess');
      case 'assign-role': return this.translateService.instant('users.toast.assignRoleSuccess');
      default: return this.translateService.instant('users.toast.lockSuccess');
    }
  }

  private modalSuccessMessage(modal: ModalAction): string {
    switch (modal) {
      case 'reject': return this.translateService.instant('users.toast.rejectSuccess');
      case 'suspend': return this.translateService.instant('users.toast.suspendSuccess');
      case 'edit-profile': return this.translateService.instant('users.toast.updateProfileSuccess');
      case 'assign-role': return this.translateService.instant('users.toast.assignRoleSuccess');
    }
  }
}
