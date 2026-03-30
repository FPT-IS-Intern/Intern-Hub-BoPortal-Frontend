import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '@/services/common/breadcrumb.service';
import { ToastService } from '@/services/common/toast.service';
import { DropdownOption, DropdownValue, SharedDropdownComponent } from '@/components/shared-dropdown/shared-dropdown.component';
import { SharedSearchComponent } from '@/components/shared-search/shared-search.component';
import { SideDrawerComponent } from '@/components/popups/side-drawer/side-drawer.component';
import { NoDataComponent } from '@/components/no-data/no-data.component';
import {
  OrgChartPageResponse,
  OrgChartStatus,
  OrgChartUserDetail,
  OrgChartUserNode,
} from '@/models/orgchart.model';
import { OrgChartService } from '@/services/api/orgchart.service';

interface UiOrgChartNode extends OrgChartUserNode {
  children: UiOrgChartNode[];
  isExpanded: boolean;
  isLoading: boolean;
  childrenLoaded: boolean;
  isHighlighted: boolean;
  depth: number;
}

@Component({
  selector: 'app-orgchart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    SharedSearchComponent,
    SharedDropdownComponent,
    SideDrawerComponent,
    NoDataComponent,
  ],
  templateUrl: './orgchart.component.html',
  styleUrl: './orgchart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgChartComponent {
  private readonly orgChartService = inject(OrgChartService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translateService = inject(TranslateService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rootNode = signal<UiOrgChartNode | null>(null);
  protected readonly pageLoading = signal(true);
  protected readonly pageError = signal(false);
  protected readonly searchLoading = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly selectedDepartment = signal('');
  protected readonly selectedStatus = signal('');
  protected readonly searchResults = signal<OrgChartUserNode[]>([]);
  protected readonly selectedDetail = signal<OrgChartUserDetail | null>(null);
  protected readonly detailVisible = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly departmentOptions = signal<DropdownOption[]>([]);
  protected readonly statusOptions = signal<DropdownOption[]>([]);
  protected readonly searchPlaceholder = signal('');
  protected readonly allDepartmentsLabel = signal('');
  protected readonly highlightedNodeId = signal<string | null>(null);
  protected readonly focusingUserId = signal<string | null>(null);
  protected readonly knownDepartmentNames = signal<string[]>([]);

  protected readonly hasActiveFilters = computed(
    () => !!this.searchTerm().trim() || !!this.selectedDepartment() || !!this.selectedStatus(),
  );
  protected readonly selectedUserTitle = computed(
    () => this.selectedDetail()?.name || this.translateService.instant('orgchart.detail.title'),
  );
  protected readonly resultSummary = computed(() => {
    if (!this.hasActiveFilters()) {
      return '';
    }

    return this.translateService.instant('orgchart.search.summary', {
      count: this.searchResults().length,
    });
  });

  constructor() {
    this.translateService
      .stream([
        'orgchart.breadcrumb.title',
        'orgchart.search.placeholder',
        'orgchart.filters.allDepartments',
        'orgchart.filters.allStatuses',
        'orgchart.status.active',
        'orgchart.status.intern',
        'orgchart.status.inactive',
      ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((translations) => {
        this.breadcrumbService.setBreadcrumbs([
          { label: this.translateService.instant('checkin.breadcrumb.home'), icon: 'custom-icon-home', url: '/main' },
          { label: translations['orgchart.breadcrumb.title'], active: true },
        ]);
        this.searchPlaceholder.set(translations['orgchart.search.placeholder']);
        this.allDepartmentsLabel.set(translations['orgchart.filters.allDepartments']);
        this.statusOptions.set([
          { label: translations['orgchart.filters.allStatuses'], value: '' },
          { label: translations['orgchart.status.active'], value: 'active' },
          { label: translations['orgchart.status.intern'], value: 'intern' },
          { label: translations['orgchart.status.inactive'], value: 'inactive' },
        ]);
        this.refreshDepartmentOptions(this.knownDepartmentNames());
      });

    void this.loadTree();
  }

  protected onSearchChange(value: string): void {
    this.searchTerm.set(value);
    void this.runSearch();
  }

  protected onDepartmentChange(value: DropdownValue): void {
    this.selectedDepartment.set(this.dropdownValueToString(value));
    void this.runSearch();
  }

  protected onStatusChange(value: DropdownValue): void {
    this.selectedStatus.set(this.dropdownValueToString(value));
    void this.runSearch();
  }

  protected resetFilters(): void {
    this.searchTerm.set('');
    this.selectedDepartment.set('');
    this.selectedStatus.set('');
    this.searchResults.set([]);
    this.clearHighlights();
  }

  protected retryLoad(): void {
    void this.loadTree();
  }

  protected toggleNode(node: UiOrgChartNode, event?: Event): void {
    event?.stopPropagation();
    if (!node.hasChildren) {
      return;
    }

    if (node.isExpanded) {
      this.rootNode.update((root) => (root ? this.patchNode(root, node.id, (target) => ({ ...target, isExpanded: false })) : root));
      return;
    }

    if (node.childrenLoaded) {
      this.rootNode.update((root) => (root ? this.patchNode(root, node.id, (target) => ({ ...target, isExpanded: true })) : root));
      return;
    }

    void this.loadChildren(node.id);
  }

  protected async showUserDetail(userId: string, event?: Event): Promise<void> {
    event?.stopPropagation();
    this.detailVisible.set(true);
    this.detailLoading.set(true);

    try {
      const response = await firstValueFrom(this.orgChartService.getUserDetail(userId));
      this.selectedDetail.set(response.data ?? null);
    } catch {
      this.toastService.error(this.translateService.instant('orgchart.toast.detailError'));
    } finally {
      this.detailLoading.set(false);
    }
  }

  protected closeDetail(): void {
    this.detailVisible.set(false);
  }

  protected async focusResult(node: OrgChartUserNode): Promise<void> {
    this.focusingUserId.set(node.id);
    try {
      await this.focusNode(node.id);
      await this.showUserDetail(node.id);
    } finally {
      this.focusingUserId.set(null);
    }
  }

  protected avatarFallback(name?: string | null): string {
    const normalized = `${name || ''}`.trim();
    if (!normalized) {
      return '?';
    }

    return normalized
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  protected statusLabel(status: OrgChartStatus): string {
    return this.translateService.instant(`orgchart.status.${status}`);
  }

  protected statusClass(status: OrgChartStatus): string {
    return `status-badge ${status}`;
  }

  protected onNodeKeydown(node: UiOrgChartNode, event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.toggleNode(node);
      return;
    }

    if (event.key === 'ArrowLeft' && node.isExpanded) {
      event.preventDefault();
      this.toggleNode(node);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void this.showUserDetail(node.id);
    }
  }

  private async loadTree(rootId?: string): Promise<void> {
    this.pageLoading.set(true);
    this.pageError.set(false);

    try {
      const response = await firstValueFrom(this.orgChartService.getTree(rootId, 2));
      this.rootNode.set(response.data ? this.toUiNode(response.data, 0, true) : null);
      this.collectDepartments();
    } catch {
      this.pageError.set(true);
      this.toastService.error(this.translateService.instant('orgchart.toast.loadError'));
    } finally {
      this.pageLoading.set(false);
    }
  }

  private async loadChildren(nodeId: string): Promise<void> {
    this.rootNode.update((root) => (root ? this.patchNode(root, nodeId, (target) => ({ ...target, isLoading: true })) : root));

    try {
      const response = await firstValueFrom(this.orgChartService.getSubordinates(nodeId, 1, 50));
      const payload = response.data as OrgChartPageResponse<OrgChartUserNode> | undefined;
      const currentNode = this.rootNode() ? this.findNode(this.rootNode()!, nodeId) : null;
      const nextDepth = currentNode ? currentNode.depth + 1 : 1;
      const children = (payload?.data ?? []).map((child) => this.toUiNode(child, nextDepth, false));

      this.rootNode.update((root) => (
        root
          ? this.patchNode(root, nodeId, (target) => ({
            ...target,
            children,
            isExpanded: true,
            isLoading: false,
            childrenLoaded: true,
          }))
          : root
      ));
      this.collectDepartments();
    } catch {
      this.rootNode.update((root) => (root ? this.patchNode(root, nodeId, (target) => ({ ...target, isLoading: false })) : root));
      this.toastService.error(this.translateService.instant('orgchart.toast.expandError'));
    }
  }

  private async runSearch(): Promise<void> {
    if (!this.hasActiveFilters()) {
      this.searchResults.set([]);
      this.clearHighlights();
      return;
    }

    this.searchLoading.set(true);
    this.clearHighlights();
    try {
      const response = await firstValueFrom(
        this.orgChartService.searchUsers(
          this.searchTerm().trim() || undefined,
          this.selectedDepartment() || undefined,
          this.selectedStatus() || undefined,
          1,
          24,
        ),
      );
      this.searchResults.set(response.data?.data ?? []);
      this.collectDepartments();
    } catch {
      this.searchResults.set([]);
      this.toastService.error(this.translateService.instant('orgchart.toast.searchError'));
    } finally {
      this.searchLoading.set(false);
    }
  }

  private async focusNode(userId: string): Promise<void> {
    const response = await firstValueFrom(this.orgChartService.getPath(userId));
    const path = response.data?.data ?? [];
    if (path.length === 0) {
      return;
    }

    const rootId = path[0]?.id;
    if (!this.rootNode() || this.rootNode()!.id !== rootId) {
      await this.loadTree(rootId);
    }

    for (let index = 0; index < path.length - 1; index += 1) {
      const currentId = path[index].id;
      const nextId = path[index + 1].id;
      const currentNode = this.rootNode() ? this.findNode(this.rootNode()!, currentId) : null;

      if (!currentNode) {
        continue;
      }

      if (!currentNode.childrenLoaded || !currentNode.children.some((child) => child.id === nextId)) {
        await this.loadChildren(currentId);
      } else if (!currentNode.isExpanded) {
        this.rootNode.update((root) => (root ? this.patchNode(root, currentId, (target) => ({ ...target, isExpanded: true })) : root));
      }
    }

    this.highlightNode(userId);
    this.scrollToNode(userId);
  }

  private highlightNode(userId: string): void {
    this.highlightedNodeId.set(userId);
    this.rootNode.update((root) => (root ? this.mapTree(root, (node) => ({ ...node, isHighlighted: node.id === userId })) : root));
  }

  private clearHighlights(): void {
    this.highlightedNodeId.set(null);
    this.rootNode.update((root) => (root ? this.mapTree(root, (node) => ({ ...node, isHighlighted: false })) : root));
  }

  private scrollToNode(userId: string): void {
    setTimeout(() => {
      const element = document.querySelector<HTMLElement>(`[data-node-id="${userId}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }, 80);
  }

  private toUiNode(node: OrgChartUserNode, depth: number, isExpanded: boolean): UiOrgChartNode {
    const children = (node.children ?? []).map((child) => this.toUiNode(child, depth + 1, false));
    return {
      ...node,
      children,
      depth,
      isExpanded,
      isLoading: false,
      childrenLoaded: children.length > 0,
      isHighlighted: false,
    };
  }

  private mapTree(node: UiOrgChartNode, mapper: (node: UiOrgChartNode) => UiOrgChartNode): UiOrgChartNode {
    const mappedChildren = node.children.map((child) => this.mapTree(child, mapper));
    return mapper({ ...node, children: mappedChildren });
  }

  private patchNode(
    node: UiOrgChartNode,
    targetId: string,
    updater: (node: UiOrgChartNode) => UiOrgChartNode,
  ): UiOrgChartNode {
    if (node.id === targetId) {
      return updater(node);
    }

    return {
      ...node,
      children: node.children.map((child) => this.patchNode(child, targetId, updater)),
    };
  }

  private findNode(node: UiOrgChartNode, targetId: string): UiOrgChartNode | null {
    if (node.id === targetId) {
      return node;
    }

    for (const child of node.children) {
      const found = this.findNode(child, targetId);
      if (found) {
        return found;
      }
    }

    return null;
  }

  private collectDepartments(): void {
    const names = new Set<string>();
    if (this.rootNode()) {
      this.walkDepartments(this.rootNode()!, names);
    }
    for (const result of this.searchResults()) {
      if (result.department?.trim()) {
        names.add(result.department.trim());
      }
    }

    const sorted = Array.from(names).sort((left, right) => left.localeCompare(right));
    this.knownDepartmentNames.set(sorted);
    this.refreshDepartmentOptions(sorted);
  }

  private walkDepartments(node: UiOrgChartNode, names: Set<string>): void {
    if (node.department?.trim()) {
      names.add(node.department.trim());
    }
    for (const child of node.children) {
      this.walkDepartments(child, names);
    }
  }

  private refreshDepartmentOptions(values: string[]): void {
    this.departmentOptions.set([
      { label: this.allDepartmentsLabel() || 'All departments', value: '' },
      ...values.map((value) => ({ label: value, value })),
    ]);
  }

  private dropdownValueToString(value: DropdownValue): string {
    return value == null ? '' : String(value);
  }
}
