import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { SharedSearchComponent } from '../../components/shared-search/shared-search.component';
import { SharedInputTextComponent } from '../../components/shared-input-text/shared-input-text.component';
import {
  DropdownOption,
  SharedDropdownComponent,
} from '../../components/shared-dropdown/shared-dropdown.component';
import { NoDataComponent } from '../../components/no-data/no-data.component';
import { TableSkeletonComponent } from '../../components/skeletons/table-skeleton/table-skeleton.component';
import { ConfirmPopup } from '../../components/popups/confirm-popup/confirm-popup';
import { ModalPopup } from '../../components/popups/modal-popup/modal-popup';
import { BreadcrumbService } from '../../services/common/breadcrumb.service';
import { LoadingService } from '../../services/common/loading.service';
import { ToastService } from '../../services/common/toast.service';
import { PortalMenuService } from '../../services/api/portal-menu.service';
import { PortalMenuItem, PortalMenuRequest } from '../../models/portal-menu.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

type FormMode = 'create' | 'edit';

interface MenuFormState {
  code: string;
  title: string;
  path: string;
  icon: string;
  parentId: number | null;
  roleCodes: string[];
  sortOrder: number;
  status: string;
}

const EMPTY_FORM: MenuFormState = {
  code: '',
  title: '',
  path: '',
  icon: '',
  parentId: null,
  roleCodes: [],
  sortOrder: 0,
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
    TooltipDirective,
  ],
  templateUrl: './menu-management.component.html',
  styleUrl: './menu-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuManagementComponent {
  private readonly menuService = inject(PortalMenuService);
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

  // Form state
  protected readonly formVisible = signal(false);
  protected readonly formMode = signal<FormMode>('create');
  protected readonly editingMenuId = signal<number | null>(null);
  protected readonly formState = signal<MenuFormState>({ ...EMPTY_FORM });
  protected readonly roleCodeInput = signal('');

  // Confirm state
  protected readonly confirmVisible = signal(false);
  protected readonly pendingDeleteMenu = signal<PortalMenuItem | null>(null);

  // Status options
  protected get statusOptions(): DropdownOption[] {
    return [
      { label: this.translateService.instant('menus.status.active'), value: 'ACTIVE' },
      { label: this.translateService.instant('menus.status.inactive'), value: 'INACTIVE' },
    ];
  }

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
      for (const item of items) {
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

  protected readonly formTitle = computed(() =>
    this.formMode() === 'create' ? this.translateService.instant('menus.dialog.createTitle') : this.translateService.instant('menus.dialog.editTitle'),
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
        next: (res) => this.menus.set(res.data ?? []),
        error: () => {
          this.menus.set([]);
          this.isError.set(true);
        },
      });
  }

  // ── Search ──
  protected onSearchChange(value: string): void {
    this.keyword.set(value);
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

  protected expandAll(): void {
    const ids = new Set<number>();
    const collect = (items: PortalMenuItem[]) => {
      items.forEach(item => {
        if (item.children?.length) {
          ids.add(item.id);
          collect(item.children);
        }
      });
    };
    collect(this.menus());
    this.expandedIds.set(ids);
  }

  protected collapseAll(): void {
    this.expandedIds.set(new Set());
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

  // ── Form: Create ──
  protected openCreateModal(): void {
    this.formMode.set('create');
    this.editingMenuId.set(null);
    this.formState.set({ ...EMPTY_FORM });
    this.roleCodeInput.set('');
    this.formVisible.set(true);
  }

  // ── Form: Edit ──
  protected openEditModal(item: PortalMenuItem): void {
    this.formMode.set('edit');
    this.editingMenuId.set(item.id);
    this.formState.set({
      code: item.code || '',
      title: item.title || '',
      path: item.path || '',
      icon: item.icon || '',
      parentId: item.parentId ?? null,
      roleCodes: [...(item.roleCodes || [])],
      sortOrder: item.sortOrder ?? 0,
      status: item.status || 'ACTIVE',
    });
    this.roleCodeInput.set('');
    this.formVisible.set(true);
  }

  protected closeForm(): void {
    this.formVisible.set(false);
  }

  protected updateFormField<K extends keyof MenuFormState>(key: K, value: MenuFormState[K]): void {
    this.formState.update(state => ({ ...state, [key]: value }));
  }

  // Role codes tag input
  protected onRoleCodeInputChange(value: string): void {
    this.roleCodeInput.set(value);
  }

  protected addRoleCode(): void {
    const code = this.roleCodeInput().trim();
    if (!code) return;
    const current = this.formState().roleCodes;
    if (!current.includes(code)) {
      this.updateFormField('roleCodes', [...current, code]);
    }
    this.roleCodeInput.set('');
  }

  protected removeRoleCode(code: string): void {
    this.updateFormField('roleCodes', this.formState().roleCodes.filter(r => r !== code));
  }

  protected onRoleCodeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addRoleCode();
    }
  }

  protected saveForm(): void {
    const state = this.formState();
    if (!state.code.trim() || !state.title.trim()) {
      this.toastService.error(`${this.translateService.instant('menus.dialog.form.code.error')} / ${this.translateService.instant('menus.dialog.form.title.error')}`);
      return;
    }

    const payload: PortalMenuRequest = {
      code: state.code.trim(),
      title: state.title.trim(),
      path: state.path.trim() || undefined,
      icon: state.icon.trim() || undefined,
      parentId: state.parentId || undefined,
      roleCodes: state.roleCodes.length ? state.roleCodes : undefined,
      sortOrder: state.sortOrder,
      status: state.status,
    };

    const mode = this.formMode();
    const request$ = mode === 'create'
      ? this.menuService.createMenu(payload)
      : this.menuService.updateMenu(this.editingMenuId()!, payload);

    request$.subscribe({
      next: () => {
        this.toastService.success(this.translateService.instant(mode === 'create' ? 'menus.toast.createSuccess' : 'menus.toast.updateSuccess'));
        this.closeForm();
        this.loadMenus();
      },
      error: () => this.toastService.error(this.translateService.instant(mode === 'create' ? 'menus.toast.createError' : 'menus.toast.updateError')),
    });
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
