import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

import { ModalPopup } from '@/components/popups/modal-popup/modal-popup';
import { SharedSearchComponent } from '@/components/shared-search/shared-search.component';
import { NoDataComponent } from '@/components/no-data/no-data.component';
import {
  DropdownOption,
  DropdownValue,
  SharedDropdownComponent,
} from '@/components/shared-dropdown/shared-dropdown.component';
import { LoadingService } from '@/services/common/loading.service';
import { ToastService } from '@/services/common/toast.service';
import { TicketApproverConfigService, TicketTypeItem } from '@/services/api/ticket-approver-config.service';
import { UserManagementService } from '@/services/api/user-management.service';
import { UserFilterRequest, UserListItem } from '@/models/user-management.model';

@Component({
  selector: 'app-ticket-approver-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalPopup, SharedSearchComponent, NoDataComponent, SharedDropdownComponent],
  templateUrl: './ticket-approver-dialog.component.html',
  styleUrl: './ticket-approver-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketApproverDialogComponent {
  private readonly ticketService = inject(TicketApproverConfigService);
  private readonly userService = inject(UserManagementService);
  private readonly loadingService = inject(LoadingService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) set visible(v: boolean) {
    this.isVisible.set(!!v);
    if (v) this.reload();
  }
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input({ required: true }) level: 1 | 2 = 1;
  @Input({ required: true }) roleName: string = '';

  protected readonly isVisible = signal(false);
  protected readonly keyword = signal('');

  protected readonly ticketTypes = signal<TicketTypeItem[]>([]);
  protected readonly selectedTicketTypeId = signal<string>('');
  protected readonly ticketTypeOptions = computed<DropdownOption[]>(() =>
    (this.ticketTypes() ?? []).map((t) => ({
      label: t.typeName,
      value: t.ticketTypeId,
      description: t.description ?? undefined,
    })),
  );

  // Used to decide whether we can apply role filter for /users/search.
  protected readonly userMetaRoles = signal<string[]>([]);
  protected readonly canFilterByRole = computed(() => {
    const name = (this.roleName || '').trim();
    if (!name) return false;
    return this.userMetaRoles().includes(name);
  });

  protected readonly approverIds = signal<Set<string>>(new Set());
  protected readonly approverUsers = signal<UserListItem[]>([]);
  protected readonly approversLoading = signal(false);
  protected readonly candidates = signal<UserListItem[]>([]);
  protected readonly candidatesLoading = signal(false);

  protected readonly title = computed(() => `Cấu hình người duyệt cấp ${this.level}`);

  close(): void {
    this.isVisible.set(false);
    this.visibleChange.emit(false);
    this.keyword.set('');
    this.candidates.set([]);
  }

  onKeywordChange(value: string): void {
    this.keyword.set(value ?? '');
    this.searchCandidates();
  }

  onTicketTypeChange(value: DropdownValue): void {
    const next = value == null ? '' : String(value);
    this.selectedTicketTypeId.set(next);
    this.keyword.set('');
    this.candidates.set([]);
    this.loadApprovers();
  }

  reload(): void {
    this.loadingService.show();
    forkJoin({
      types: this.ticketService.getTicketTypes(),
      meta: this.userService.getMetaOptions(),
    })
      .pipe(
        finalize(() => this.loadingService.hide()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ types, meta }) => {
          const typesData = types.data ?? [];
          const metaRoles = meta.data?.roles ?? [];
          this.userMetaRoles.set(metaRoles);
          this.ticketTypes.set(typesData);

          const current = this.selectedTicketTypeId();
          const nextId =
            current && typesData.some((t) => t.ticketTypeId === current) ? current : typesData[0]?.ticketTypeId ?? '';
          this.selectedTicketTypeId.set(nextId);
          this.loadApprovers();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Không thể tải dữ liệu cấu hình');
          this.ticketTypes.set([]);
          this.userMetaRoles.set([]);
          this.selectedTicketTypeId.set('');
          this.approverUsers.set([]);
          this.approverIds.set(new Set());
        },
      });
  }

  private loadApprovers(): void {
    const ticketTypeId = this.selectedTicketTypeId();
    if (!ticketTypeId) {
      this.approverUsers.set([]);
      this.approverIds.set(new Set());
      this.approversLoading.set(false);
      return;
    }

    this.approversLoading.set(true);
    this.loadingService.show();
    this.ticketService
      .getApproverIds(ticketTypeId, this.level)
      .pipe(
        switchMap((res) => {
          const ids = res.data ?? [];
          this.approverIds.set(new Set(ids));
          if (ids.length === 0) return of([]);
          return forkJoin(ids.map((id) => this.userService.getUserById(id)));
        }),
        finalize(() => {
          this.loadingService.hide();
          this.approversLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (users) => {
          const list = (users ?? [])
            .map((r: any) => r?.data)
            .filter(Boolean)
            .map((d: any) => ({
              userId: d.userId,
              fullName: d.fullName,
              email: d.email,
              avatarUrl: d.avatarUrl,
              role: d.role,
              sysStatus: d.status,
            })) as UserListItem[];
          this.approverUsers.set(list);

          // Refresh candidate list after assigned approvers change.
          const q = this.keyword().trim();
          if (q || this.canFilterByRole()) {
            this.searchCandidates();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Không thể tải danh sách người duyệt');
          this.approverUsers.set([]);
          this.approverIds.set(new Set());
        },
      });
  }

  searchCandidates(): void {
    const ticketTypeId = this.selectedTicketTypeId();
    if (!ticketTypeId) {
      this.toastService.warning('Vui lòng chọn loại phiếu');
      return;
    }

    const q = this.keyword().trim();
    // If we can't filter by role and user doesn't provide keyword, avoid fetching a huge list.
    if (!q && !this.canFilterByRole()) {
      this.candidates.set([]);
      return;
    }

    this.candidatesLoading.set(true);

    const request: UserFilterRequest = {
      keyword: q || undefined,
      sysStatuses: ['ACTIVE'],
      roles: this.canFilterByRole() ? [this.roleName] : undefined,
    };

    this.userService
      .filterUsers(request, 1, 10, true)
      .pipe(
        finalize(() => this.candidatesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          const items = res.data?.items ?? [];
          const assigned = this.approverIds();
          this.candidates.set(items.filter((u) => u.userId && !assigned.has(u.userId)));
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Không thể tải danh sách người dùng');
          this.candidates.set([]);
        },
      });
  }

  addApprover(user: UserListItem): void {
    if (!user.userId) return;
    const ticketTypeId = this.selectedTicketTypeId();
    if (!ticketTypeId) return;

    this.loadingService.show();
    this.ticketService
      .assignApprover(ticketTypeId, user.userId, this.level)
      .pipe(
        finalize(() => this.loadingService.hide()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Đã thêm người duyệt');
          this.loadApprovers();
          this.candidates.update((list) => list.filter((c) => c.userId !== user.userId));
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Thêm người duyệt thất bại');
        },
      });
  }

  removeApprover(user: UserListItem): void {
    if (!user.userId) return;
    const ticketTypeId = this.selectedTicketTypeId();
    if (!ticketTypeId) return;

    this.loadingService.show();
    this.ticketService
      .removeApprover(ticketTypeId, user.userId, this.level)
      .pipe(
        finalize(() => this.loadingService.hide()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Đã gỡ người duyệt');
          this.loadApprovers();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Gỡ người duyệt thất bại');
        },
      });
  }
}
