import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, concatMap, finalize, of, throwError } from 'rxjs';
import { SharedSearchComponent } from '@/components/shared-search/shared-search.component';
import { SharedInputTextComponent } from '@/components/shared-input-text/shared-input-text.component';
import {
  DropdownValue,
  DropdownOption,
  SharedDropdownComponent,
} from '@/components/shared-dropdown/shared-dropdown.component';
import { NoDataComponent } from '@/components/no-data/no-data.component';
import { TableSkeletonComponent } from '@/components/skeletons/table-skeleton/table-skeleton.component';
import { ConfirmPopup } from '@/components/popups/confirm-popup/confirm-popup';
import { ModalPopup } from '@/components/popups/modal-popup/modal-popup';
import { PaginationComponent } from '@/components/pagination/pagination.component';
import { BreadcrumbService } from '@/services/common/breadcrumb.service';
import { LoadingService } from '@/services/common/loading.service';
import { ToastService } from '@/services/common/toast.service';
import { AuthzService } from '@/services/api/authz.service';
import { PortalMenuService } from '@/services/api/portal-menu.service';
import { PortalMenuItem, PortalMenuRequest } from '@/models/portal-menu.model';
import { AuthzRole } from '@/models/authz.model';
import { TooltipDirective } from '@/directives/tooltip.directive';

type FormMode = 'create' | 'edit';

interface MenuFormState {
  code: string;
  title: string;
  path: string;
  icon: string;
  parentId: number | null;
  roleCodes: string[];
  sortOrder: string;
  status: string;
}

const EMPTY_FORM: MenuFormState = {
  code: '',
  title: '',
  path: '',
  icon: '',
  parentId: null,
  roleCodes: [],
  sortOrder: '0',
  status: 'ACTIVE',
};

interface FlatRow {
  menu: PortalMenuItem;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SharedSearchComponent,
    SharedInputTextComponent,
    SharedDropdownComponent,
    NoDataComponent,
    TableSkeletonComponent,
    ConfirmPopup,
    ModalPopup,
    PaginationComponent,
    TooltipDirective,
  ],
  templateUrl: './menu-management.component.html',
  styleUrl: './menu-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuManagementComponent {
  private readonly menuService = inject(PortalMenuService);
  private readonly authzService = inject(AuthzService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translateService = inject(TranslateService);
  private readonly loadingService = inject(LoadingService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly menus = signal<PortalMenuItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isError = signal(false);
  protected readonly keyword = signal('');
  protected readonly expandedIds = signal<Set<number>>(new Set());

  // Pagination (paginate by root menu; each root keeps its expanded children together)
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(10);

  // Form state
  protected readonly formVisible = signal(false);
  protected readonly formMode = signal<FormMode>('create');
  protected readonly editingMenuId = signal<number | null>(null);
  protected readonly formState = signal<MenuFormState>({ ...EMPTY_FORM });
  protected readonly roleCodeInputErrorKey = signal<string | null>(null);
  protected readonly formSubmitted = signal(false);
  private sortOrderTouched = false;
  private statusTouched = false;
  private originalParentId: number | null = null;
  private originalSortOrder: number = 0;

  protected readonly swapConfirmVisible = signal(false);
  protected readonly swapTargetMenu = signal<PortalMenuItem | null>(null);
  private swapInProgress = false;

  protected readonly selectedRoleName = signal('');
  protected readonly roles = signal<AuthzRole[]>([]);
  protected readonly rolesLoading = signal(false);
  protected readonly rolesLoadError = signal(false);

  protected readonly roleOptions = computed<DropdownOption[]>(() =>
    {
      const selectedRoles = new Set(
        this.formState().roleCodes
          .map((role) => (role || '').trim())
          .filter(Boolean),
      );

      return (this.roles() ?? [])
        .map((role) => (role.name || '').trim())
        .filter((roleName) => !!roleName && !selectedRoles.has(roleName))
        .map((roleName) => ({ label: roleName, value: roleName }));
    },
  );
  protected readonly sortOrderBlockedValue = signal<number | null>(null);
  protected readonly sortOrderBlockedMenu = signal<PortalMenuItem | null>(null);
  protected readonly orderDropdownOpen = signal(false);
  @ViewChild('sortOrderWrap') private sortOrderWrap?: ElementRef<HTMLElement>;

  // Confirm state
  protected readonly confirmVisible = signal(false);
  protected readonly pendingDeleteMenu = signal<PortalMenuItem | null>(null);

  // Parent dropdown
  protected readonly parentOptions = computed<DropdownOption[]>(() => {
    const editingId = this.editingMenuId();
    const opts: DropdownOption[] = [{ label: this.translateService.instant('menus.dialog.form.parentId.placeholder'), value: '' }];
    const addOptions = (items: PortalMenuItem[], prefix = '') => {
      for (const item of items) {
        // Prevent selecting self or own children as parent
        if (editingId && item.id === editingId) continue;
        opts.push({ label: `${prefix}${item.title} (${item.code})`, value: String(item.id) });
        if (item.children?.length) {
          addOptions(item.children, `${prefix}  └ `);
        }
      }
    };
    addOptions(this.menus());
    return opts;
  });

  // Flatten hierarchy for display
  protected readonly flatRows = computed<FlatRow[]>(() => {
    const expanded = this.expandedIds();
    const kw = this.keyword().trim().toLowerCase();
    const rows: FlatRow[] = [];

    const flatten = (items: PortalMenuItem[], depth: number) => {
      // Sort items by sortOrder ascending before processing
      const sortedItems = [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      for (const item of sortedItems) {
        const hasChildren = !!(item.children?.length);
        const isExpanded = expanded.has(item.id);

        // Keyword filter: show item if it matches or any descendant matches
        if (kw && !matchesKeyword(item, kw)) continue;

        rows.push({ menu: item, depth, hasChildren, expanded: isExpanded });

        if (hasChildren && isExpanded) {
          flatten(item.children!, depth + 1);
        }
      }
    };

    flatten(this.menus(), 0);
    return rows;
  });

  private readonly groupedFlatRows = computed<FlatRow[][]>(() => {
    const rows = this.flatRows();
    const groups: FlatRow[][] = [];
    let current: FlatRow[] = [];

    for (const row of rows) {
      if (row.depth === 0) {
        if (current.length) groups.push(current);
        current = [row];
      } else {
        current.push(row);
      }
    }
    if (current.length) groups.push(current);

    return groups;
  });

  protected readonly totalRoots = computed(() => this.groupedFlatRows().length);

  private readonly totalPages = computed(() => {
    const size = this.pageSize();
    const total = this.totalRoots();
    return Math.ceil(total / size) || 0;
  });

  private readonly effectivePageIndex = computed(() => {
    const total = this.totalPages();
    if (total <= 0) return 1;
    return Math.min(Math.max(this.pageIndex(), 1), total);
  });

  protected readonly pagedRows = computed<FlatRow[]>(() => {
    const groups = this.groupedFlatRows();
    const page = this.effectivePageIndex();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return groups.slice(start, start + size).flat();
  });

  protected readonly displayRange = computed(() => {
    const total = this.totalRoots();
    if (!total) return '';
    const page = this.effectivePageIndex();
    const size = this.pageSize();
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    return `${start}-${end}/${total}`;
  });

  protected readonly formTitle = computed(() =>
    this.formMode() === 'create' ? 'menus.dialog.createTitle' : 'menus.dialog.editTitle',
  );

  protected readonly codeValidationErrorKey = computed<string | null>(() => {
    const code = this.formState().code.trim();
    if (!code) return 'menus.dialog.form.code.error';
    if (!/^[A-Z][A-Z0-9_]*$/.test(code)) return 'menus.validation.codeFormat';

    const excludeId = this.formMode() === 'edit' ? this.editingMenuId() : null;
    const exists = allMenus(this.menus()).some((m) => {
      if (excludeId && m.id === excludeId) return false;
      return (m.code || '').trim().toUpperCase() === code.toUpperCase();
    });

    return exists ? 'menus.validation.codeDuplicate' : null;
  });

  protected readonly codeErrorKey = computed<string | null>(() => {
    const err = this.codeValidationErrorKey();
    if (!err) return null;
    if (err === 'menus.dialog.form.code.error') return this.formSubmitted() ? err : null;
    return err;
  });

  protected readonly titleValidationErrorKey = computed<string | null>(() => {
    const title = this.formState().title.trim();
    return title ? null : 'menus.dialog.form.title.error';
  });

  protected readonly titleErrorKey = computed<string | null>(() => {
    const err = this.titleValidationErrorKey();
    if (!err) return null;
    return this.formSubmitted() ? err : null;
  });

  protected readonly pathValidationErrorKey = computed<string | null>(() => {
    const path = this.formState().path.trim();
    if (!path) return this.formMode() === 'create' && this.formSubmitted() ? 'menus.validation.pathRequired' : null;
    // Allow Angular-like routes: /a, /a/b, /a/:id, etc. No spaces.
    if (!path.startsWith('/') || /\s/.test(path) || !/^\/[A-Za-z0-9\-._~/:]*$/.test(path)) {
      return 'menus.validation.pathFormat';
    }
    return null;
  });

  protected readonly iconValidationErrorKey = computed<string | null>(() => {
    const icon = this.formState().icon.trim();
    if (!icon) return this.formMode() === 'create' && this.formSubmitted() ? 'menus.validation.iconRequired' : null;
    return null;
  });

  protected readonly sortOrderValidationErrorKey = computed<string | null>(() => {
    const raw = (this.formState().sortOrder ?? '').trim();
    const val = raw === '' ? 0 : Number(raw);
    if (!Number.isInteger(val) || val < 0) return 'menus.validation.sortOrderFormat';
    return null;
  });

  protected readonly sortOrderConflictMenu = computed<PortalMenuItem | null>(() => {
    const raw = (this.formState().sortOrder ?? '').trim();
    const val = raw === '' ? 0 : Number(raw);
    if (!Number.isInteger(val) || val < 0) return null;

    const parentId = normalizeParentId(this.formState().parentId);
    const excludeId = this.formMode() === 'edit' ? this.editingMenuId() : null;
    const siblings = siblingsByParent(this.menus(), parentId, excludeId);
    return siblings.find((m) => Number(m.sortOrder ?? 0) === val) ?? null;
  });

  private shouldSwapWithConflict(): boolean {
    if (this.formMode() !== 'edit') return false;
    const parentId = normalizeParentId(this.formState().parentId);
    return parentId === this.originalParentId && !!this.editingMenuId() && !!this.sortOrderConflictMenu();
  }

  protected readonly sortOrderWillSwap = computed(() => this.shouldSwapWithConflict());

  protected readonly sortOrderSwapDownTarget = computed<number>(() => {
    const parentId = normalizeParentId(this.formState().parentId);
    return lastSortOrder(this.menus(), parentId, null);
  });

  protected readonly levelMenusPreview = computed(() => {
    const parentId = normalizeParentId(this.formState().parentId);
    const currentId = this.formMode() === 'edit' ? this.editingMenuId() : null;
    const blockedMenu = this.sortOrderConflictMenu();

    const siblings = siblingsByParent(this.menus(), parentId, null);
    const rows = siblings
      .map((m) => ({
        id: m.id,
        sortOrder: Number(m.sortOrder ?? 0) || 0,
        code: m.code,
        title: m.title,
        isCurrent: !!currentId && m.id === currentId,
        isBlocked: !!blockedMenu && m.id === blockedMenu.id,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));

    // Pin the blocked/conflict menu to top for quick recognition (requested UX).
    if (blockedMenu) {
      const idx = rows.findIndex((r) => r.id === blockedMenu.id);
      if (idx > 0) {
        const [it] = rows.splice(idx, 1);
        rows.unshift(it);
      }
    }

    return rows;
  });

  private canSwapSortOrder(): boolean {
    if (this.formMode() !== 'edit') return false;
    const currentId = this.editingMenuId();
    if (!currentId) return false;

    const parentId = normalizeParentId(this.formState().parentId);
    // Swap only makes sense when staying in the same level (same parent).
    if (parentId !== this.originalParentId) return false;

    return !!this.sortOrderConflictMenu();
  }

  protected readonly suggestedSortOrder = computed<number>(() => {
    const parentId = normalizeParentId(this.formState().parentId);
    const excludeId = this.formMode() === 'edit' ? this.editingMenuId() : null;
    return nextAvailableSortOrder(this.menus(), parentId, excludeId);
  });

  protected readonly roleCodesValidationErrorKey = computed<string | null>(() => {
    const roleCodes = this.formState().roleCodes;
    const roleNames = new Set(this.roles().map((r) => (r.name || '').trim()));
    if (roleNames.size) {
      for (const code of roleCodes) {
        if (!roleNames.has((code || '').trim())) return 'menus.validation.roleCodeNotFound';
      }
      return null;
    }

    for (const code of roleCodes) {
      if (!isReasonableRoleCode(code)) return 'menus.validation.roleCodeFormat';
    }
    return null;
  });

  protected readonly isFormValid = computed(() =>
    !this.codeValidationErrorKey() &&
    !this.titleValidationErrorKey() &&
    !this.pathValidationErrorKey() &&
    !this.iconValidationErrorKey() &&
    !this.sortOrderValidationErrorKey() &&
    !this.roleCodesValidationErrorKey(),
  );

  constructor() {
    this.translateService
      .stream('menus.breadcrumb.title')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((title) => {
        this.breadcrumbService.setBreadcrumbs([
          { label: this.translateService.instant('checkin.breadcrumb.home'), icon: 'custom-icon-home', url: '/main' },
          { label: title || this.translateService.instant('menus.breadcrumb.title'), active: true },
        ]);
      });

    this.loadMenus();
  }

  // ── Data ──
  protected loadMenus(): void {
    this.isError.set(false);
    this.isLoading.set(true);
    this.loadingService.showPageLoading();

    this.menuService.getAllMenus()
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.loadingService.hidePageLoading();
      }))
      .subscribe({
        next: (res) => {
          this.menus.set(res.data ?? []);
          this.pageIndex.set(1);
        },
        error: () => {
          this.menus.set([]);
          this.isError.set(true);
          this.pageIndex.set(1);
        },
      });
  }

  // ── Search ──
  protected onSearchChange(value: string): void {
    this.keyword.set(value);
    this.pageIndex.set(1);
  }

  protected onPageIndexChange(next: number): void {
    this.pageIndex.set(next);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
  }

  // ── Tree expand/collapse ──
  protected toggleExpand(id: number): void {
    this.expandedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ── Status helpers ──
  protected statusLabel(status?: string): string {
    return status?.toUpperCase() === 'ACTIVE' ? this.translateService.instant('menus.status.active') : this.translateService.instant('menus.status.inactive');
  }

  protected statusClass(status?: string): string {
    return status?.toUpperCase() === 'ACTIVE' ? 'status-chip active' : 'status-chip inactive';
  }

  protected rolesText(roleCodes?: string[]): string {
    if (!roleCodes?.length) return '—';
    return roleCodes.map(r => r.replace('ROLE_', '')).join(', ');
  }

  protected onStatusToggle(event: Event): void {
    this.statusTouched = true;
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    this.updateFormField('status', checked ? 'ACTIVE' : 'INACTIVE');
  }

  // ── Form: Create ──
  protected openCreateModal(): void {
    this.formMode.set('create');
    this.editingMenuId.set(null);
    this.formState.set({
      ...EMPTY_FORM,
      sortOrder: String(lastSortOrder(this.menus(), null, null)),
      // If admin does not select any role codes, default to hidden.
      status: 'INACTIVE',
    });
    this.selectedRoleName.set('');
    this.roleCodeInputErrorKey.set(null);
    this.formSubmitted.set(false);
    this.sortOrderTouched = false;
    this.statusTouched = false;
    this.loadRolesIfNeeded();
    this.originalParentId = null;
    this.originalSortOrder = 0;
    this.orderDropdownOpen.set(false);
    this.formVisible.set(true);
  }

  // ── Form: Edit ──
  protected openEditModal(item: PortalMenuItem): void {
    this.formMode.set('edit');
    this.editingMenuId.set(item.id);
    this.originalParentId = normalizeParentId(item.parentId);
    this.originalSortOrder = Number(item.sortOrder ?? 0) || 0;
    const normalizedRoleCodes = normalizeRoleCodes(item.roleCodes || []);
    this.formState.set({
      code: item.code || '',
      title: item.title || '',
      path: item.path || '',
      icon: item.icon || '',
      parentId: item.parentId ?? null,
      roleCodes: normalizedRoleCodes,
      sortOrder: String(item.sortOrder ?? 0),
      status: item.status || 'ACTIVE',
    });
    this.selectedRoleName.set('');
    this.roleCodeInputErrorKey.set(null);
    this.formSubmitted.set(false);
    this.sortOrderTouched = false;
    this.statusTouched = false;
    this.loadRolesIfNeeded();
    this.orderDropdownOpen.set(false);
    this.formVisible.set(true);
  }

  protected closeForm(): void {
    this.formVisible.set(false);
    this.orderDropdownOpen.set(false);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.orderDropdownOpen()) return;
    const host = this.sortOrderWrap?.nativeElement;
    const target = event.target as Node | null;
    if (!host || !target) return;
    if (host.contains(target)) return;
    this.orderDropdownOpen.set(false);
  }

  protected updateFormField<K extends keyof MenuFormState>(key: K, value: MenuFormState[K]): void {
    let nextValue: MenuFormState[K] = value;

    // Auto-normalize menu code while typing.
    if (key === 'code' && typeof nextValue === 'string') {
      nextValue = nextValue.toUpperCase() as MenuFormState[K];
    }

    if (key === 'sortOrder') {
      this.sortOrderTouched = true;

      const raw = String(nextValue ?? '').trim();
      const num = raw === '' ? 0 : Number(raw);

      // Allow invalid intermediate values so the user can edit; format validation will show inline.
      if (!Number.isInteger(num) || num < 0) {
        this.formState.update((state) => ({ ...state, sortOrder: String(nextValue ?? '') }));
        this.orderDropdownOpen.set(false);
        return;
      }
      this.formState.update((state) => ({ ...state, sortOrder: String(num) }));
      this.orderDropdownOpen.set(!!this.sortOrderConflictMenu());
      return;
    }

    if (key === 'parentId') {
      const parentId = normalizeParentId(nextValue as unknown as number | null);
      this.formState.update((state) => {
        if (this.sortOrderTouched) return { ...state, parentId: parentId };
        return {
          ...state,
          parentId: parentId,
          sortOrder: String(lastSortOrder(this.menus(), parentId, this.formMode() === 'edit' ? this.editingMenuId() : null)),
        };
      });
      this.orderDropdownOpen.set(false);
      return;
    }

    this.formState.update(state => ({ ...state, [key]: nextValue }));
  }

  // Role codes selection
  private loadRolesIfNeeded(): void {
    if (this.rolesLoading()) return;
    if (this.roles().length) return;

    this.rolesLoadError.set(false);
    this.rolesLoading.set(true);
    this.authzService.getRoles()
      .pipe(finalize(() => this.rolesLoading.set(false)))
      .subscribe({
        next: (res) => this.roles.set(res.data ?? []),
        error: () => this.rolesLoadError.set(true),
      });
  }

  protected onRoleSelect(value: DropdownValue): void {
    const normalizedValue = value == null ? '' : String(value);
    this.selectedRoleName.set(normalizedValue);
    this.roleCodeInputErrorKey.set(null);
    if (normalizedValue) this.addSelectedRole();
  }

  private addSelectedRole(): void {
    const roleName = (this.selectedRoleName() || '').trim();
    if (!roleName) return;

    const current = this.formState().roleCodes.map((c) => (c || '').trim());
    if (current.includes(roleName)) {
      this.roleCodeInputErrorKey.set('menus.validation.roleCodeDuplicate');
      return;
    }

    const nextRoles = [...current, roleName];
    this.updateFormField('roleCodes', nextRoles);

    // Create-mode smart default: roles selected => show by default (unless admin manually changed status).
    if (this.formMode() === 'create' && !this.statusTouched) {
      this.updateFormField('status', nextRoles.length ? 'ACTIVE' : 'INACTIVE');
    }
    this.selectedRoleName.set('');
  }

  protected removeRoleCode(code: string): void {
    const nextRoles = this.formState().roleCodes.filter(r => r !== code);
    this.updateFormField('roleCodes', nextRoles);

    // Create-mode smart default: no roles => hidden (unless admin manually changed status).
    if (this.formMode() === 'create' && !this.statusTouched) {
      this.updateFormField('status', nextRoles.length ? 'ACTIVE' : 'INACTIVE');
    }
  }

  protected saveForm(): void {
    this.formSubmitted.set(true);
    const state = this.formState();
    const normalizedRoleCodes = normalizeRoleCodes(state.roleCodes);

    const firstHardErrorKey =
      this.codeValidationErrorKey() ||
      this.titleValidationErrorKey() ||
      this.pathValidationErrorKey() ||
      this.iconValidationErrorKey() ||
      // sortOrderDuplicate is handled as a smart flow below (swap/suggest)
      (this.sortOrderValidationErrorKey() === 'menus.validation.sortOrderDuplicate' ? null : this.sortOrderValidationErrorKey()) ||
      this.roleCodesValidationErrorKey() ||
      this.roleCodeInputErrorKey();

    if (firstHardErrorKey) {
      this.toastService.error(this.translateService.instant(firstHardErrorKey));
      return;
    }

    const payload: PortalMenuRequest = {
      code: state.code.trim(),
      title: state.title.trim(),
      path: state.path.trim() || undefined,
      icon: state.icon.trim() || undefined,
      parentId: state.parentId || undefined,
      roleCodes: normalizedRoleCodes?.length ? normalizedRoleCodes : undefined,
      sortOrder: parseInt(state.sortOrder.trim() || '0', 10) || 0,
      status: state.status,
    };

    const mode = this.formMode();
    const conflict = this.sortOrderConflictMenu();
    const parentId = normalizeParentId(state.parentId);
    const desiredSortOrder = payload.sortOrder ?? 0;

    const apply$ = () => mode === 'create'
      ? this.menuService.createMenu(payload)
      : this.menuService.updateMenu(this.editingMenuId()!, payload);

    const request$ = conflict
      ? (this.shouldSwapWithConflict()
        ? this.swapSortOrderWithConflict$(conflict, desiredSortOrder)
        : this.menuService
          .updateMenu(conflict.id, { ...buildRequestFromMenuItem(conflict), sortOrder: lastSortOrder(this.menus(), parentId, null) })
          .pipe(concatMap(() => apply$())))
      : apply$();

    request$.subscribe({
      next: () => {
        this.toastService.success(this.translateService.instant(mode === 'create' ? 'menus.toast.createSuccess' : 'menus.toast.updateSuccess'));
        this.closeForm();
        this.loadMenus();
      },
      error: () => this.toastService.error(this.translateService.instant(mode === 'create' ? 'menus.toast.createError' : 'menus.toast.updateError')),
    });
  }

  protected cancelSwapSortOrder(): void {
    this.swapConfirmVisible.set(false);
    this.swapTargetMenu.set(null);
  }

  private swapSortOrderWithConflict$(conflict: PortalMenuItem, desiredSortOrder: number) {
    const currentId = this.editingMenuId();
    if (!currentId) return throwError(() => new Error('Missing editingMenuId'));

    const state = this.formState();
    const parentId = normalizeParentId(state.parentId);
    if (parentId !== this.originalParentId) {
      return throwError(() => new Error('Swap is only supported within the same level'));
    }

    // Use a temporary order to avoid backend unique constraints during swap.
    const temp = nextAvailableSortOrder(this.menus(), parentId, currentId /* exclude current only */);

    const currentPayload: PortalMenuRequest = {
      code: state.code.trim(),
      title: state.title.trim(),
      path: state.path.trim() || undefined,
      icon: state.icon.trim() || undefined,
      parentId: state.parentId || undefined,
      roleCodes: state.roleCodes.length ? normalizeRoleCodes(state.roleCodes) : undefined,
      sortOrder: desiredSortOrder,
      status: state.status,
    };

    const targetPayloadBase = buildRequestFromMenuItem(conflict);
    const moveTargetToTemp: PortalMenuRequest = {
      ...targetPayloadBase,
      sortOrder: temp,
      parentId: conflict.parentId ?? undefined,
    };
    const moveTargetToOldCurrent: PortalMenuRequest = {
      ...targetPayloadBase,
      sortOrder: this.originalSortOrder,
      parentId: conflict.parentId ?? undefined,
    };

    this.loadingService.showPageLoading();
    return this.menuService.updateMenu(conflict.id, moveTargetToTemp).pipe(
      concatMap(() => this.menuService.updateMenu(currentId, currentPayload)),
      concatMap(() => this.menuService.updateMenu(conflict.id, moveTargetToOldCurrent)),
      finalize(() => this.loadingService.hidePageLoading()),
    );
  }

  protected confirmSwapSortOrder(): void {
    if (this.swapInProgress) return;
    const currentId = this.editingMenuId();
    const target = this.swapTargetMenu();
    if (!currentId || !target) return;

    const state = this.formState();
    const desiredSortOrder = parseInt(state.sortOrder.trim() || '0', 10) || 0;
    const parentId = normalizeParentId(state.parentId);
    if (parentId !== this.originalParentId) return;

    // Use a temporary order to avoid backend unique constraints during swap.
    const temp = nextAvailableSortOrder(this.menus(), parentId, currentId /* exclude current only */);
    const currentPayload: PortalMenuRequest = {
      code: state.code.trim(),
      title: state.title.trim(),
      path: state.path.trim() || undefined,
      icon: state.icon.trim() || undefined,
      parentId: state.parentId || undefined,
      roleCodes: state.roleCodes.length ? normalizeRoleCodes(state.roleCodes) : undefined,
      sortOrder: desiredSortOrder,
      status: state.status,
    };

    const targetPayloadBase = buildRequestFromMenuItem(target);
    const moveTargetToTemp: PortalMenuRequest = { ...targetPayloadBase, sortOrder: temp, parentId: target.parentId || undefined };
    const moveTargetToOldCurrent: PortalMenuRequest = {
      ...targetPayloadBase,
      sortOrder: this.originalSortOrder,
      parentId: target.parentId || undefined,
    };

    this.swapInProgress = true;
    this.swapConfirmVisible.set(false);

    this.loadingService.showPageLoading();
    this.menuService.updateMenu(target.id, moveTargetToTemp).pipe(
      concatMap(() => this.menuService.updateMenu(currentId, currentPayload)),
      concatMap(() => this.menuService.updateMenu(target.id, moveTargetToOldCurrent)),
      catchError((err) => {
        // Best-effort: reload UI; backend state might be partial.
        return throwError(() => err);
      }),
      finalize(() => {
        this.swapInProgress = false;
        this.swapTargetMenu.set(null);
        this.loadingService.hidePageLoading();
      }),
    ).subscribe({
      next: () => {
        this.toastService.success(this.translateService.instant('menus.validation.sortOrderSwapped'));
        this.closeForm();
        this.loadMenus();
      },
      error: () => {
        this.toastService.error(this.translateService.instant('menus.toast.updateError'));
        this.loadMenus();
      },
    });
  }

  protected acceptSuggestedSortOrder(): void {
    const suggested = this.suggestedSortOrder();
    this.formState.update((s) => ({ ...s, sortOrder: String(suggested) }));
  }

  // ── Delete ──
  protected requestDelete(item: PortalMenuItem, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteMenu.set(item);
    this.confirmVisible.set(true);
  }

  protected cancelDelete(): void {
    this.confirmVisible.set(false);
    this.pendingDeleteMenu.set(null);
  }

  protected confirmDelete(): void {
    const item = this.pendingDeleteMenu();
    if (!item) return;

    this.confirmVisible.set(false);
    this.menuService.deleteMenu(item.id).subscribe({
      next: () => {
        this.toastService.success(this.translateService.instant('menus.toast.deleteSuccess'));
        this.pendingDeleteMenu.set(null);
        this.loadMenus();
      },
      error: () => this.toastService.error(this.translateService.instant('menus.toast.deleteError')),
    });
  }

  protected readonly confirmMessage = computed(() => {
    const name = this.pendingDeleteMenu()?.title || this.translateService.instant('menus.table.title');
    return this.translateService.instant('menus.confirmDelete.message', { title: name });
  });
}

function matchesKeyword(item: PortalMenuItem, kw: string): boolean {
  if (
    item.code?.toLowerCase().includes(kw) ||
    item.title?.toLowerCase().includes(kw) ||
    item.path?.toLowerCase().includes(kw)
  ) {
    return true;
  }
  return item.children?.some(child => matchesKeyword(child, kw)) ?? false;
}

function allMenus(items: PortalMenuItem[]): PortalMenuItem[] {
  const out: PortalMenuItem[] = [];
  const walk = (list: PortalMenuItem[]) => {
    for (const it of list) {
      out.push(it);
      if (it.children?.length) walk(it.children);
    }
  };
  walk(items);
  return out;
}

function isReasonableRoleCode(code: string): boolean {
  const v = (code ?? '').trim();
  // Fallback validation when roles list is not available.
  // Allow common role name/code formats without spaces.
  return !!v && /^[A-Za-z0-9_:\-./]+$/.test(v);
}

function normalizeParentId(parentId: number | null | undefined): number | null {
  return parentId == null ? null : parentId;
}

function siblingsByParent(
  roots: PortalMenuItem[],
  parentId: number | null,
  excludeId: number | null,
): PortalMenuItem[] {
  const flat = allMenus(roots);
  return flat.filter((m) => {
    if (excludeId && m.id === excludeId) return false;
    return normalizeParentId(m.parentId) === parentId;
  });
}

function nextAvailableSortOrder(
  roots: PortalMenuItem[],
  parentId: number | null,
  excludeId: number | null,
): number {
  const siblings = siblingsByParent(roots, parentId, excludeId);
  const used = new Set<number>();
  for (const s of siblings) {
    const n = Number(s.sortOrder ?? 0);
    if (Number.isInteger(n) && n >= 0) used.add(n);
  }
  let candidate = 0;
  while (used.has(candidate)) candidate++;
  return candidate;
}

function lastSortOrder(
  roots: PortalMenuItem[],
  parentId: number | null,
  excludeId: number | null,
): number {
  const siblings = siblingsByParent(roots, parentId, excludeId);
  let max = -1;
  for (const s of siblings) {
    const n = Number(s.sortOrder ?? -1);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

function buildRequestFromMenuItem(item: PortalMenuItem): PortalMenuRequest {
  return {
    code: (item.code || '').trim(),
    title: (item.title || '').trim(),
    path: item.path?.trim() || undefined,
    icon: item.icon?.trim() || undefined,
    parentId: item.parentId ?? undefined,
    roleCodes: item.roleCodes?.length ? normalizeRoleCodes(item.roleCodes) : undefined,
    sortOrder: Number(item.sortOrder ?? 0) || 0,
    status: item.status || 'ACTIVE',
  };
}

function normalizeRoleCodes(roleCodes: string[]): string[] {
  if (!roleCodes?.length) return [];
  const unique = new Set<string>();
  for (const code of roleCodes) {
    const trimmed = (code ?? '').trim();
    if (trimmed) unique.add(trimmed);
  }
  return Array.from(unique);
}
