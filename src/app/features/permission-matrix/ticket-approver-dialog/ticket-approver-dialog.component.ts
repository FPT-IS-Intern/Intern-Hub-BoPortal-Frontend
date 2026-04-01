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
import { LoadingService } from '@/services/common/loading.service';
import { ToastService } from '@/services/common/toast.service';
import { TicketApproverConfigService } from '@/services/api/ticket-approver-config.service';
import { UserManagementService } from '@/services/api/user-management.service';
import { UserFilterRequest, UserListItem } from '@/models/user-management.model';

@Component({
  selector: 'app-ticket-approver-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalPopup, SharedSearchComponent, NoDataComponent],
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

  protected readonly level1ApproverIds = signal<Set<string>>(new Set());
  protected readonly level2ApproverIds = signal<Set<string>>(new Set());
  protected readonly approverUsers = signal<UserListItem[]>([]);
  protected readonly approversLoading = signal(false);

  protected readonly candidates = signal<UserListItem[]>([]);
  protected readonly candidatesLoading = signal(false);

  // Used to decide whether we can apply role filter for /users/search.
  protected readonly userMetaRoles = signal<string[]>([]);
  protected readonly canFilterByRole = computed(() => {
    const name = (this.roleName || '').trim();
    if (!name) return false;
    return this.userMetaRoles().includes(name);
  });

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

  reload(): void {
    this.loadingService.show();
    this.userService
      .getMetaOptions()
      .pipe(
        finalize(() => this.loadingService.hide()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (meta) => {
          const metaRoles = meta.data?.roles ?? [];
          this.userMetaRoles.set(metaRoles);
          this.loadApprovers();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Không thể tải dữ liệu cấu hình');
          this.userMetaRoles.set([]);
          this.level1ApproverIds.set(new Set());
          this.level2ApproverIds.set(new Set());
          this.approverUsers.set([]);
        },
      });
  }

  private loadApprovers(): void {
    this.approversLoading.set(true);
    this.loadingService.show();

    forkJoin({
      ids1: this.ticketService.getApproverIds(1),
      ids2: this.ticketService.getApproverIds(2),
    })
      .pipe(
        switchMap(({ ids1, ids2 }) => {
          const level1 = new Set(ids1.data ?? []);
          const level2 = new Set(ids2.data ?? []);
          this.level1ApproverIds.set(level1);
          this.level2ApproverIds.set(level2);

          const ids = this.level === 2 ? Array.from(level2) : Array.from(level1);
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
          this.level1ApproverIds.set(new Set());
          this.level2ApproverIds.set(new Set());
          this.approverUsers.set([]);
        },
      });
  }

  protected badgeForUser(u: UserListItem): string {
    const id = String(u.userId ?? '');
    if (!id) return '';

    const inL1 = this.level1ApproverIds().has(id);
    const inL2 = this.level2ApproverIds().has(id);

    if (this.level === 2) {
      if (inL2) return 'Cấp 2';
      if (inL1) return 'Quyền duyệt cấp 1';
      return '';
    }

    // Level 1 dialog shows all approvers; highlight who also has level 2.
    if (inL2) return 'Cấp 2';
    if (inL1) return 'Cấp 1';
    return '';
  }

  searchCandidates(): void {
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

    const excludeSet = this.level === 2 ? this.level2ApproverIds() : this.level1ApproverIds();

    this.userService
      .filterUsers(request, 1, 10, true)
      .pipe(
        finalize(() => this.candidatesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          const items = res.data?.items ?? [];
          this.candidates.set(items.filter((u) => !excludeSet.has(String(u.userId))));
        },
        error: (err) => {
          console.error(err);
          this.candidates.set([]);
        },
      });
  }

  addApprover(u: UserListItem): void {
    const userId = String(u.userId ?? '');
    if (!userId) return;

    this.loadingService.show();
    this.ticketService
      .assignApprover(userId, this.level)
      .pipe(
        finalize(() => this.loadingService.hide()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Cập nhật thành công');
          this.loadApprovers();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Cập nhật thất bại');
        },
      });
  }

  removeApprover(u: UserListItem): void {
    const userId = String(u.userId ?? '');
    if (!userId) return;

    this.loadingService.show();
    this.ticketService
      .removeApprover(userId, this.level)
      .pipe(
        finalize(() => this.loadingService.hide()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Cập nhật thành công');
          this.loadApprovers();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Cập nhật thất bại');
        },
      });
  }
}

