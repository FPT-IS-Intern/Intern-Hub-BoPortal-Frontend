import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
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
  OrgChartUserLite,
  OrgChartUserNode,
} from '@/models/orgchart.model';
import { OrgChartService } from '@/services/api/orgchart.service';
import { UserManagementService } from '@/services/api/user-management.service';

type DrawerMode = 'view' | 'assign-member' | 'move-node';

interface UiOrgChartNode extends OrgChartUserNode {
  children: UiOrgChartNode[];
  isExpanded: boolean;
  isLoading: boolean;
  childrenLoaded: boolean;
  isHighlighted: boolean;
  depth: number;
}

interface FocusPathItem {
  id: string;
  label: string;
  title?: string;
  isEllipsis?: boolean;
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
  private static readonly MIN_ZOOM = 0.6;
  private static readonly MAX_ZOOM = 1.8;
  private static readonly ZOOM_STEP = 0.1;
  private static readonly DEEP_FOCUS_DEPTH = 6;

  private readonly orgChartService = inject(OrgChartService);
  private readonly userManagementService = inject(UserManagementService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translateService = inject(TranslateService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('treeViewport')
  private treeViewportRef?: ElementRef<HTMLDivElement>;

  @ViewChild('toolbarStack')
  private toolbarStackRef?: ElementRef<HTMLDivElement>;

  protected readonly rootNode = signal<UiOrgChartNode | null>(null);
  protected readonly pageLoading = signal(true);
  protected readonly pageError = signal(false);
  protected readonly searchLoading = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly selectedDepartment = signal('');
  protected readonly selectedStatus = signal('');
  protected readonly searchResults = signal<OrgChartUserNode[]>([]);
  protected readonly searchPanelOpen = signal(false);
  protected readonly focusPath = signal<OrgChartUserLite[]>([]);
  protected readonly forceTreeOverview = signal(false);
  protected readonly selectedDetail = signal<OrgChartUserDetail | null>(null);
  protected readonly detailVisible = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly drawerMode = signal<DrawerMode>('view');
  protected readonly saving = signal(false);
  protected readonly departmentOptions = signal<DropdownOption[]>([]);
  protected readonly statusOptions = signal<DropdownOption[]>([]);
  protected readonly searchPlaceholder = signal('');
  protected readonly allDepartmentsLabel = signal('');
  protected readonly highlightedNodeId = signal<string | null>(null);
  protected readonly focusingUserId = signal<string | null>(null);
  protected readonly knownDepartmentNames = signal<string[]>([]);
  protected readonly zoomScale = signal(1);
  protected readonly isPanning = signal(false);
  protected readonly panX = signal(0);
  protected readonly panY = signal(0);
  protected readonly positionOptions = signal<string[]>([]);
  protected readonly managerSearchTerm = signal('');
  protected readonly managerSearchLoading = signal(false);
  protected readonly managerSearchResults = signal<OrgChartUserLite[]>([]);
  protected readonly formManagerId = signal<string | null>(null);
  protected readonly formManagerLabel = signal('');
  protected readonly candidateSearchTerm = signal('');
  protected readonly candidateSearchLoading = signal(false);
  protected readonly candidateSearchResults = signal<OrgChartUserLite[]>([]);
  protected readonly selectedCandidateId = signal<string | null>(null);
  protected readonly selectedCandidateLabel = signal('');

  protected readonly hasActiveFilters = computed(
    () => !!this.searchTerm().trim() || !!this.selectedDepartment() || !!this.selectedStatus(),
  );
  protected readonly searchPanelVisible = computed(
    () => this.hasActiveFilters() && this.searchPanelOpen(),
  );
  protected readonly isFormMode = computed(() => this.drawerMode() !== 'view');
  protected readonly drawerTitle = computed(() => {
    if (this.drawerMode() === 'assign-member') {
      return this.translateService.instant('orgchart.drawer.assignTitle');
    }
    if (this.drawerMode() === 'move-node') {
      return this.translateService.instant('orgchart.drawer.moveTitle');
    }
    return this.selectedDetail()?.name || this.translateService.instant('orgchart.detail.title');
  });
  protected readonly deepFocusMode = computed(
    () => !this.forceTreeOverview() && this.focusPath().length > OrgChartComponent.DEEP_FOCUS_DEPTH && !!this.selectedDetail(),
  );
  protected readonly condensedFocusPath = computed<FocusPathItem[]>(() => {
    const path = this.focusPath();
    if (path.length <= 6) {
      return path.map((item) => ({ id: item.id, label: item.name, title: item.title ?? undefined }));
    }

    const head = path[0];
    const tail = path.slice(-4);
    return [
      { id: head.id, label: head.name, title: head.title ?? undefined },
      { id: '__ellipsis__', label: '...', isEllipsis: true },
      ...tail.map((item) => ({ id: item.id, label: item.name, title: item.title ?? undefined })),
    ];
  });
  protected readonly resultSummary = computed(() => {
    if (!this.hasActiveFilters()) {
      return '';
    }

    return this.translateService.instant('orgchart.search.summary', {
      count: this.searchResults().length,
    });
  });
  protected readonly zoomLabel = computed(() => `${Math.round(this.zoomScale() * 100)}%`);
  protected readonly gridMinorSize = computed(() => 24 * this.zoomScale());
  protected readonly gridMajorSize = computed(() => 120 * this.zoomScale());
  protected readonly gridOffsetX = computed(() => `calc(50% + ${this.panX()}px)`);
  protected readonly gridOffsetY = computed(() => `calc(50% + ${this.panY()}px)`);
  protected readonly viewportTransform = computed(
    () => `translate(calc(-50% + ${this.panX()}px), calc(-50% + ${this.panY()}px)) scale(${this.zoomScale()})`,
  );
  protected readonly selectedManagerName = computed(() => {
    const selectedId = this.formManagerId();
    if (!selectedId) {
      return '';
    }
    if (this.formManagerLabel()) {
      return this.formManagerLabel();
    }
    return this.managerSearchResults().find((item) => item.id === selectedId)?.name ?? '';
  });
  protected readonly selectedCandidateName = computed(() => {
    const selectedId = this.selectedCandidateId();
    if (!selectedId) {
      return '';
    }
    if (this.selectedCandidateLabel()) {
      return this.selectedCandidateLabel();
    }
    return this.candidateSearchResults().find((item) => item.id === selectedId)?.name ?? '';
  });

  private activePointerId: number | null = null;
  private panStartX = 0;
  private panStartY = 0;
  private panStartOffsetX = 0;
  private panStartOffsetY = 0;

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
    void this.loadMetaOptions();
  }

  protected onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.searchPanelOpen.set(!!value.trim() || !!this.selectedDepartment() || !!this.selectedStatus());
    void this.runSearch();
  }

  protected onDepartmentChange(value: DropdownValue): void {
    this.selectedDepartment.set(this.dropdownValueToString(value));
    this.searchPanelOpen.set(!!this.searchTerm().trim() || !!this.selectedDepartment() || !!this.selectedStatus());
    void this.runSearch();
  }

  protected onStatusChange(value: DropdownValue): void {
    this.selectedStatus.set(this.dropdownValueToString(value));
    this.searchPanelOpen.set(!!this.searchTerm().trim() || !!this.selectedDepartment() || !!this.selectedStatus());
    void this.runSearch();
  }

  protected retryLoad(): void {
    void this.loadTree();
  }

  protected openAssignMemberForm(): void {
    const detail = this.selectedDetail();
    if (!detail) {
      return;
    }

    this.drawerMode.set('assign-member');
    this.selectedCandidateId.set(null);
    this.selectedCandidateLabel.set('');
    this.candidateSearchTerm.set('');
    this.candidateSearchResults.set([]);
  }

  protected openMoveNodeForm(): void {
    const detail = this.selectedDetail();
    if (!detail) {
      return;
    }

    this.drawerMode.set('move-node');
    this.formManagerId.set(detail.manager?.id ?? null);
    this.formManagerLabel.set(detail.manager?.name ?? '');
    this.managerSearchTerm.set(detail.manager?.name ?? '');
    this.managerSearchResults.set([]);
  }

  protected async saveAssignMember(): Promise<void> {
    if (this.saving()) {
      return;
    }

    const targetNode = this.selectedDetail();
    const selectedUserId = this.selectedCandidateId();
    if (!targetNode || !selectedUserId) {
      this.toastService.error(this.translateService.instant('orgchart.toast.selectUserError'));
      return;
    }

    this.saving.set(true);
    try {
      await firstValueFrom(this.orgChartService.updateManager(selectedUserId, targetNode.id));
      await this.reloadTree(targetNode.id);
      this.drawerMode.set('view');
      this.toastService.success(this.translateService.instant('orgchart.toast.assignSuccess'));
    } catch {
      this.toastService.error(this.translateService.instant('orgchart.toast.assignError'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async saveMoveNode(): Promise<void> {
    const detail = this.selectedDetail();
    if (!detail || this.saving()) {
      return;
    }

    this.saving.set(true);
    try {
      await firstValueFrom(this.orgChartService.updateManager(detail.id, this.formManagerId()));
      await this.reloadTree(detail.id);
      this.drawerMode.set('view');
      this.toastService.success(this.translateService.instant('orgchart.toast.moveSuccess'));
    } catch {
      this.toastService.error(this.translateService.instant('orgchart.toast.moveError'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async removeSelectedUserFromNode(): Promise<void> {
    const detail = this.selectedDetail();
    if (!detail || this.saving()) {
      return;
    }

    const confirmed = window.confirm(
      this.translateService.instant('orgchart.confirm.removeMessage', { name: detail.name }),
    );
    if (!confirmed) {
      return;
    }

    this.saving.set(true);
    try {
      await firstValueFrom(this.orgChartService.updateManager(detail.id, null));
      await this.reloadTree(undefined, detail.id);
      this.closeDetail();
      this.toastService.success(this.translateService.instant('orgchart.toast.removeSuccess'));
    } catch {
      this.toastService.error(this.translateService.instant('orgchart.toast.removeError'));
    } finally {
      this.saving.set(false);
    }
  }

  protected onManagerSearchChange(value: string): void {
    this.managerSearchTerm.set(value);
    if (!value.trim()) {
      this.formManagerLabel.set('');
      this.formManagerId.set(null);
    }
    void this.searchManagers();
  }

  protected clearManagerSelection(): void {
    this.formManagerId.set(null);
    this.formManagerLabel.set('');
    this.managerSearchTerm.set('');
    this.managerSearchResults.set([]);
  }

  protected onCandidateSearchChange(value: string): void {
    this.candidateSearchTerm.set(value);
    if (!value.trim()) {
      this.selectedCandidateId.set(null);
      this.selectedCandidateLabel.set('');
    }
    void this.searchAssignableUsers();
  }

  protected chooseCandidate(candidate: OrgChartUserLite): void {
    this.selectedCandidateId.set(candidate.id);
    this.selectedCandidateLabel.set(candidate.name);
    this.candidateSearchTerm.set(candidate.name);
    this.candidateSearchResults.set([]);
  }

  protected chooseManager(candidate: OrgChartUserLite): void {
    if (candidate.id === this.selectedDetail()?.id) {
      return;
    }

    this.formManagerId.set(candidate.id);
    this.formManagerLabel.set(candidate.name);
    this.managerSearchTerm.set(candidate.name);
    this.managerSearchResults.set([]);
  }

  protected cancelForm(): void {
    this.drawerMode.set('view');
    this.managerSearchResults.set([]);
    this.managerSearchTerm.set('');
    this.candidateSearchResults.set([]);
    this.candidateSearchTerm.set('');
  }

  protected onDetailVisibleChange(visible: boolean): void {
    if (visible) {
      this.detailVisible.set(true);
      return;
    }
    this.closeDetail();
  }

  protected zoomIn(): void {
    this.updateZoom(this.zoomScale() + OrgChartComponent.ZOOM_STEP);
  }

  protected zoomOut(): void {
    this.updateZoom(this.zoomScale() - OrgChartComponent.ZOOM_STEP);
  }

  protected resetViewport(): void {
    this.zoomScale.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  protected onTreeWheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    event.preventDefault();
    const delta = event.deltaY < 0 ? OrgChartComponent.ZOOM_STEP : -OrgChartComponent.ZOOM_STEP;
    this.updateZoom(this.zoomScale() + delta, event.clientX, event.clientY);
  }

  protected onTreePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('.org-card, .expand-button, .viewport-btn, .viewport-scale')) {
      return;
    }

    const viewport = this.treeViewportRef?.nativeElement;
    if (!viewport) {
      return;
    }

    this.isPanning.set(true);
    this.activePointerId = event.pointerId;
    this.panStartX = event.clientX;
    this.panStartY = event.clientY;
    this.panStartOffsetX = this.panX();
    this.panStartOffsetY = this.panY();
    viewport.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  protected onTreePointerMove(event: PointerEvent): void {
    if (!this.isPanning() || this.activePointerId !== event.pointerId) {
      return;
    }

    this.panX.set(this.panStartOffsetX + (event.clientX - this.panStartX));
    this.panY.set(this.panStartOffsetY + (event.clientY - this.panStartY));
  }

  protected onTreePointerUp(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    const viewport = this.treeViewportRef?.nativeElement;
    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    this.isPanning.set(false);
    this.activePointerId = null;
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
    this.drawerMode.set('view');
    this.managerSearchResults.set([]);

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
    this.detailLoading.set(false);
    this.drawerMode.set('view');
    this.selectedDetail.set(null);
    this.managerSearchResults.set([]);
    this.managerSearchTerm.set('');
    this.candidateSearchResults.set([]);
    this.candidateSearchTerm.set('');
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

  protected statusDotClass(status: OrgChartStatus): string {
    return `status-dot ${status}`;
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

  protected returnToTreeOverview(): void {
    this.forceTreeOverview.set(true);
  }

  protected async focusPathNode(nodeId: string): Promise<void> {
    this.focusingUserId.set(nodeId);
    this.forceTreeOverview.set(false);
    try {
      await this.focusNode(nodeId);
      await this.showUserDetail(nodeId);
    } finally {
      this.focusingUserId.set(null);
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected handleDocumentPointerDown(event: PointerEvent): void {
    if (!this.searchPanelVisible()) {
      return;
    }

    const target = event.target as Node | null;
    const toolbarStack = this.toolbarStackRef?.nativeElement;
    if (!target || !toolbarStack || toolbarStack.contains(target)) {
      return;
    }

    this.searchPanelOpen.set(false);
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

  private async loadMetaOptions(): Promise<void> {
    try {
      const response = await firstValueFrom(this.userManagementService.getMetaOptions());
      this.positionOptions.set([...(response.data?.positions ?? [])].sort((left, right) => left.localeCompare(right)));
    } catch {
      this.positionOptions.set([]);
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

  private async searchManagers(): Promise<void> {
    const query = this.managerSearchTerm().trim();
    if (!query) {
      this.managerSearchResults.set([]);
      return;
    }

    this.managerSearchLoading.set(true);
    try {
      const response = await firstValueFrom(this.orgChartService.searchUsers(query, undefined, undefined, 1, 8));
      const currentUserId = this.selectedDetail()?.id;
      this.managerSearchResults.set(
        (response.data?.data ?? [])
          .filter((item) => item.id !== currentUserId)
          .map((item) => ({
            id: item.id,
            name: item.name,
            title: item.title ?? undefined,
            avatar: item.avatar ?? null,
          })),
      );
    } catch {
      this.managerSearchResults.set([]);
      this.toastService.error(this.translateService.instant('orgchart.toast.searchManagerError'));
    } finally {
      this.managerSearchLoading.set(false);
    }
  }

  private async searchAssignableUsers(): Promise<void> {
    const query = this.candidateSearchTerm().trim();
    if (!query) {
      this.candidateSearchResults.set([]);
      return;
    }

    this.candidateSearchLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.userManagementService.filterUsers({ keyword: query }, 1, 8, true),
      );
      const currentNodeId = this.selectedDetail()?.id;
      this.candidateSearchResults.set(
        (response.data?.items ?? [])
          .filter((item) => item.userId !== currentNodeId)
          .map((item) => ({
            id: item.userId,
            name: item.fullName || item.email || item.userId,
            title: item.position || undefined,
            avatar: item.avatarUrl ?? null,
          })),
      );
    } catch {
      this.candidateSearchResults.set([]);
      this.toastService.error(this.translateService.instant('orgchart.toast.searchUserError'));
    } finally {
      this.candidateSearchLoading.set(false);
    }
  }

  private async reloadTree(focusUserId?: string, deletedUserId?: string): Promise<void> {
    const currentRootId = this.rootNode()?.id;
    const nextRootId = currentRootId && currentRootId !== deletedUserId ? currentRootId : undefined;
    await this.loadTree(nextRootId);

    if (focusUserId) {
      await this.focusNode(focusUserId);
      await this.showUserDetail(focusUserId);
      return;
    }

    this.clearHighlights();
    this.focusPath.set([]);
    this.forceTreeOverview.set(true);
  }

  private async focusNode(userId: string): Promise<void> {
    const response = await firstValueFrom(this.orgChartService.getPath(userId));
    const path = response.data?.data ?? [];
    if (path.length === 0) {
      return;
    }

    this.focusPath.set(path);
    this.forceTreeOverview.set(false);

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
      const viewport = this.treeViewportRef?.nativeElement;
      if (!element || !viewport) {
        return;
      }

      const targetRect = element.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      const viewportCenterX = viewportRect.left + (viewportRect.width / 2);
      const viewportCenterY = viewportRect.top + (viewportRect.height / 2);
      const targetCenterX = targetRect.left + (targetRect.width / 2);
      const targetCenterY = targetRect.top + (targetRect.height / 2);

      this.panX.update((value) => value + (viewportCenterX - targetCenterX));
      this.panY.update((value) => value + (viewportCenterY - targetCenterY));
    }, 80);
  }

  private updateZoom(nextZoom: number, clientX?: number, clientY?: number): void {
    const currentZoom = this.zoomScale();
    const clampedZoom = Math.min(OrgChartComponent.MAX_ZOOM, Math.max(OrgChartComponent.MIN_ZOOM, nextZoom));

    const viewport = this.treeViewportRef?.nativeElement;
    if (!viewport || clampedZoom === currentZoom) {
      this.zoomScale.set(clampedZoom);
      return;
    }

    if (clientX != null && clientY != null) {
      const bounds = viewport.getBoundingClientRect();
      const viewportVectorX = clientX - (bounds.left + (bounds.width / 2));
      const viewportVectorY = clientY - (bounds.top + (bounds.height / 2));
      const zoomRatio = clampedZoom / currentZoom;

      this.panX.set(viewportVectorX - (zoomRatio * (viewportVectorX - this.panX())));
      this.panY.set(viewportVectorY - (zoomRatio * (viewportVectorY - this.panY())));
    }

    this.zoomScale.set(clampedZoom);
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
