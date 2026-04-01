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

  @Input({ required: true }) set level(v: 1 | 2) {
    this.levelSignal.set(v ?? 1);
  }
  @Input({ required: true }) roleName: string = '';

  protected readonly isVisible = signal(false);
  protected readonly levelSignal = signal<1 | 2>(1);
  protected readonly keyword = signal('');

  protected readonly level1ApproverIds = signal<Set<string>>(new Set());
  protected readonly level2ApproverIds = signal<Set<string>>(new Set());
  protected readonly approverUsers = signal<UserListItem[]>([]);
  protected readonly approversLoading = signal(false);

  protected readonly candidates = signal<UserListItem[]>([]);
  protected readonly placeholderCandidates = signal<UserListItem[]>([]);
  protected readonly candidatesLoading = signal(false);

  protected readonly userMetaRoles = signal<string[]>([]);
  protected readonly canFilterByRole = computed(() => {
    const name = (this.roleName || '').trim();
    if (!name) return false;
    return this.userMetaRoles().includes(name);
  });

  protected readonly title = computed(() => `Cấu hình người duyệt cấp ${this.levelSignal()}`);

  close(): void {
    this.isVisible.set(false);
    this.visibleChange.emit(false);
    this.keyword.set('');
    this.candidates.set([]);
    this.placeholderCandidates.set([]);
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
          this.userMetaRoles.set(meta.data?.roles ?? []);
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

          const ids = this.levelSignal() === 2 ? Array.from(level2) : Array.from(level1);
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

          // Always load default candidates (10 rows) when popup data is ready.
          this.searchCandidates();
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

    if (this.levelSignal() === 2) {
      if (inL2) return 'Cấp 2';
      if (inL1) return 'Quyền duyệt cấp 1';
      return '';
    }

    if (inL2) return 'Cấp 2';
    if (inL1) return 'Cấp 1';
    return '';
  }

  protected showLevel1CornerTag(u: UserListItem): boolean {
    if (this.levelSignal() !== 2) return false;
    const id = String(u.userId ?? '');
    if (!id) return false;
    return this.level1ApproverIds().has(id) && !this.level2ApproverIds().has(id);
  }

  searchCandidates(): void {
    const q = this.keyword().trim();
    const excludeSet = this.levelSignal() === 2 ? this.level2ApproverIds() : this.level1ApproverIds();

    // Prefer local filter on default placeholder data to avoid unnecessary API calls.
    if (q) {
      const norm = q.toLowerCase();
      const local = this.placeholderCandidates().filter((u) => {
        const name = (u.fullName ?? '').toLowerCase();
        const email = (u.email ?? '').toLowerCase();
        const role = (u.role ?? '').toLowerCase();
        return name.includes(norm) || email.includes(norm) || role.includes(norm);
      });
      if (local.length > 0) {
        this.candidates.set(local.filter((u) => !excludeSet.has(String(u.userId))));
        this.candidatesLoading.set(false);
        return;
      }
    }

    this.candidatesLoading.set(true);
    const requestWithRole: UserFilterRequest = {
      keyword: q || undefined,
      sysStatuses: ['ACTIVE'],
      roles: this.canFilterByRole() ? [this.roleName] : undefined,
    };
    const requestNoRole: UserFilterRequest = {
      keyword: q || undefined,
      sysStatuses: ['ACTIVE'],
    };

    this.userService
      .filterUsers(requestWithRole, 1, 10, true)
      .pipe(
        switchMap((res) => {
          const firstItems = res.data?.items ?? [];
          if (firstItems.length > 0 || !this.canFilterByRole()) {
            return of(firstItems);
          }
          // Role filter can be stale/non-standard -> fallback to generic search.
          return this.userService.filterUsers(requestNoRole, 1, 10, true).pipe(
            switchMap((fallbackRes) => of(fallbackRes.data?.items ?? [])),
          );
        }),
        finalize(() => this.candidatesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => {
          const filtered = items.filter((u) => !excludeSet.has(String(u.userId)));
          this.candidates.set(filtered);
          if (!q) {
            // Keep latest default page as local placeholder data for fast local search.
            this.placeholderCandidates.set(filtered);
          }
        },
        error: (err) => {
          console.error(err);
          this.candidates.set([]);
          if (!q) {
            this.placeholderCandidates.set([]);
          }
        },
      });
  }

  addApprover(u: UserListItem): void {
    const userId = String(u.userId ?? '');
    if (!userId) return;

    this.loadingService.show();
    this.ticketService
      .assignApprover(userId, this.levelSignal())
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
      .removeApprover(userId, this.levelSignal())
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
