import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@/services/common/breadcrumb.service';
import { SharedSearchComponent } from '@/components/shared-search/shared-search.component';
import { SharedDropdownComponent, DropdownOption, DropdownValue } from '@/components/shared-dropdown/shared-dropdown.component';
import { NotificationPaginationComponent } from './notification-pagination/notification-pagination.component';
import { DataTableComponent, DataTableColumn } from '@/components/data-table/data-table.component';
import { TableSkeletonComponent } from '@/components/skeletons/table-skeleton/table-skeleton.component';
import { NoDataComponent } from '@/components/no-data/no-data.component';
import { ModalPopup } from '@/components/popups/modal-popup/modal-popup';
import { TemplateService } from '@/services/api/template.service';
import { TemplateResponse, TemplateSummaryResponse } from '@/models/template.model';
import { finalize } from 'rxjs';
import { SafeHtmlPipe } from './safe-html.pipe';

type ChannelType = 'EMAIL' | 'PUSH' | 'IN_APP';
type ChannelFilter = 'ALL' | ChannelType;
type ChannelFormat = 'HTML' | 'TEXT';

interface ParamSchemaItem {
  key: string;
  description?: string;
}


interface ChannelConfig {
  id?: string | number;
  channel: ChannelType;
  active: boolean;
  format: ChannelFormat;
  subject?: string;
  content: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
  locale?: string;
}

interface ChannelHistoryItem extends ChannelConfig {}

interface NotificationCode {
  code: string;
  name: string;
  active: boolean;
  channels: ChannelConfig[];
  paramsSchemaByChannel: Record<ChannelType, Record<string, string>>;
  historyByChannel: Record<ChannelType, ChannelHistoryItem[]>;
  isDeletable?: boolean;
  definitionDescription?: string;
  definitionExists?: boolean;
  isNew?: boolean;
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    SharedSearchComponent,
    SharedDropdownComponent,
    NotificationPaginationComponent,
    DataTableComponent,
    TableSkeletonComponent,
    NoDataComponent,
    ModalPopup,
    SafeHtmlPipe,
  ],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly templateService = inject(TemplateService);

  viewMode: 'list' | 'detail' = 'list';

  searchCode = '';
  channelFilter: ChannelFilter = 'ALL';

  pageIndex = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 50];

  channelFilterOptions: DropdownOption[] = [];
  formatOptions: DropdownOption[] = [];
  createChannelOptions: DropdownOption[] = [];
  tableColumns: DataTableColumn[] = [
    { key: 'code', label: 'notification.master.table.code', cellClass: 'code-cell' },
    { key: 'name', label: 'notification.master.table.name', cellClass: 'name-cell' },
    { key: 'channels', label: 'notification.master.table.channels' },
    { key: 'actions', label: 'notification.master.table.actions', headerClass: 'col-actions', cellClass: 'col-actions', align: 'right' },
  ];

  selectedCode: NotificationCode | null = null;
  selectedChannel: ChannelType = 'EMAIL';
  selectedChannelConfig: ChannelConfig | null = null;
  addChannelValue: ChannelType | null = null;
  allChannels: ChannelType[] = ['EMAIL', 'PUSH', 'IN_APP'];

  isCreateModalOpen = false;
  isParamsModalOpen = false;
  isHistoryOpen = false;

  createCodeValue = '';
  createDescriptionValue = '';
  createChannelValue: ChannelType = 'EMAIL';
  createErrors: Partial<Record<'code' | 'description' | 'channel', string>> = {};

  paramsDraft: ParamSchemaItem[] = [];
  paramsErrors: Record<number, string> = {};
  definitionDescriptionDraft = '';
  htmlEditorMode: 'design' | 'source' = 'design';
  dirtyByChannel: Partial<Record<ChannelType, boolean>> = {};

  historySelection: ChannelHistoryItem | null = null;
  isRestoreConfirmOpen = false;
  restoreCandidate: ChannelHistoryItem | null = null;

  get historyItems(): ChannelHistoryItem[] {
    if (!this.selectedCode) return [];
    return this.selectedCode.historyByChannel[this.selectedChannel] || [];
  }

  get availableChannels(): ChannelType[] {
    if (!this.selectedCode) return [];
    return this.selectedCode.channels
      .filter(channel => channel.active)
      .map(channel => channel.channel);
  }

  get missingChannelOptions(): DropdownOption[] {
    if (!this.selectedCode) return [];
    const existing = new Set(this.selectedCode.channels.map(channel => channel.channel));
    const baseChannels = this.availableChannelsFromApi && this.availableChannelsFromApi.length
      ? this.availableChannelsFromApi
      : this.allChannels;
    return baseChannels
      .filter(channel => !existing.has(channel))
      .map(channel => ({
        label: this.translate.instant(`notification.master.channels.${channel === 'IN_APP' ? 'inApp' : channel.toLowerCase()}`),
        value: channel,
      }));
  }

  get paramsList(): ParamSchemaItem[] {
    if (!this.selectedCode) return [];
    const schema = this.selectedCode.paramsSchemaByChannel[this.selectedChannel] || {};
    return Object.entries(schema).map(([key, desc]) => ({
      key,
      description: desc || 'Bi?n van b?n',
    }));
  }

  notificationCodes: NotificationCode[] = [];
  totalItems = 0;
  isLoading = false;
  isLoadError = false;
  currentLocale = 'vi';
  availableChannelsFromApi: ChannelType[] | null = null;
  isHistoryLoading = false;
  isDeleteConfirmOpen = false;
  deleteCandidate: NotificationCode | null = null;

  constructor() {
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateDropdownLabels();
        this.refreshBreadcrumbs();
        this.currentLocale = this.translate.currentLang || 'vi';
        this.loadTemplates();
      });

    this.updateDropdownLabels();
    this.refreshBreadcrumbs();

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params.get('view') === 'list' && this.viewMode !== 'list') {
          this.backToList(false);
        }
      });
  }

  ngOnInit(): void {
    this.currentLocale = this.translate.currentLang || 'vi';
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.isLoading = true;
    this.isLoadError = false;
    const code = this.searchCode.trim();
    const channel = this.channelFilter === 'ALL' ? undefined : this.channelFilter;
    this.templateService.listTemplateSummaries({
      code: code || undefined,
      channel: channel || undefined,
      page: Math.max(this.pageIndex - 1, 0),
      size: this.pageSize
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.notificationCodes = this.mapSummariesToNotificationCodes(response.data.items || []);
            this.totalItems = response.data.total ?? this.notificationCodes.length;
            this.isLoadError = false;
            const nextPage = (response.data.page ?? 0) + 1;
            if (nextPage !== this.pageIndex) {
              this.pageIndex = nextPage;
            }
            return;
          }
          this.notificationCodes = [];
          this.totalItems = 0;
          this.isLoadError = false;
        },
        error: (error) => {
          console.error('Error loading templates:', error);
          this.notificationCodes = [];
          this.totalItems = 0;
          this.isLoadError = true;
        }
      });
  }

  retryLoadTemplates(): void {
    this.loadTemplates();
  }

  private mapSummariesToNotificationCodes(summaries: TemplateSummaryResponse[]): NotificationCode[] {
    return summaries.map(summary => ({
      code: summary.code,
      name: summary.description || summary.code,
      active: true,
      isDeletable: summary.isDeletable,
      channels: this.normalizeChannels(summary.channels || []).map(channel => ({
        channel,
        active: true,
        format: 'TEXT',
        subject: '',
        content: '',
        version: 0,
        updatedAt: this.formatDateTime(summary.updatedAt),
        updatedBy: 'System',
      })),
      paramsSchemaByChannel: {
        EMAIL: {},
        PUSH: {},
        IN_APP: {},
      },
      historyByChannel: {
        EMAIL: [],
        PUSH: [],
        IN_APP: [],
      },
    }));
  }

  private refreshBreadcrumbs(): void {
    const masterLabel = this.translate.instant('notification.master.breadcrumb.title');
    if (this.viewMode === 'detail' && this.selectedCode) {
      const detailLabel = this.translate.instant('notification.master.detail.title', { code: this.selectedCode.code });
      this.breadcrumbService.setBreadcrumbs([
        { label: 'Home', icon: 'custom-icon-home', url: '/main' },
        { label: masterLabel, url: '/notifications', queryParams: { view: 'list' } },
        { label: detailLabel, active: true },
      ]);
      return;
    }

    this.breadcrumbService.setBreadcrumbs([
      { label: 'Home', icon: 'custom-icon-home', url: '/main' },
      { label: masterLabel, active: true },
    ]);
  }

  private updateDropdownLabels(): void {
    this.channelFilterOptions = [
      { label: this.translate.instant('notification.master.filters.channels.all'), value: 'ALL' },
      { label: this.translate.instant('notification.master.channels.email'), value: 'EMAIL' },
      { label: this.translate.instant('notification.master.channels.push'), value: 'PUSH' },
      { label: this.translate.instant('notification.master.channels.inApp'), value: 'IN_APP' },
    ];

    this.formatOptions = [
      { label: this.translate.instant('notification.master.detail.form.formatHtml'), value: 'HTML' },
      { label: this.translate.instant('notification.master.detail.form.formatText'), value: 'TEXT' },
    ];

    this.createChannelOptions = [
      { label: this.translate.instant('notification.master.channels.email'), value: 'EMAIL' },
      { label: this.translate.instant('notification.master.channels.push'), value: 'PUSH' },
      { label: this.translate.instant('notification.master.channels.inApp'), value: 'IN_APP' },
    ];

  }

  get filteredCodes(): NotificationCode[] {
    return this.notificationCodes;
  }

  get total(): number {
    return this.totalItems;
  }

  get listOfData(): NotificationCode[] {
    return this.notificationCodes;
  }

  get displayRange(): string {
    if (this.total === 0) return '0-0';
    const start = (this.pageIndex - 1) * this.pageSize + 1;
    const end = Math.min(this.pageIndex * this.pageSize, this.total);
    return `${start}-${end}`;
  }

  openCreateModal(): void {
    this.createCodeValue = '';
    this.createDescriptionValue = '';
    this.createChannelValue = 'EMAIL';
    this.createErrors = {};
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  handleCreateContinue(): void {
    this.createErrors = {};
    const normalized = this.createCodeValue.trim().toUpperCase().replace(/\s+/g, '_');
    if (!normalized) {
      this.createErrors.code = 'notification.master.create.errors.codeRequired';
    }

    const description = this.createDescriptionValue.trim();
    if (!description) {
      this.createErrors.description = 'notification.master.create.errors.descriptionRequired';
    }
    if (!this.createChannelValue) {
      this.createErrors.channel = 'notification.master.create.errors.channelRequired';
    }

    if (Object.keys(this.createErrors).length > 0) {
      this.createCodeValue = normalized;
      return;
    }

    const exists = this.notificationCodes.some(item => item.code === normalized);
    if (exists) {
      this.createCodeValue = normalized;
      this.createErrors.code = 'notification.master.create.errors.codeExists';
      return;
    }

    const newItem: NotificationCode = {
      code: normalized,
      name: description || normalized,
      active: true,
      paramsSchemaByChannel: {
        EMAIL: {},
        PUSH: {},
        IN_APP: {},
      },
      channels: [
        {
          channel: this.createChannelValue,
          active: true,
          format: 'TEXT',
          subject: '',
          content: '',
          version: 0,
          updatedAt: '',
          updatedBy: 'Admin',
        },
      ],
      historyByChannel: {
        EMAIL: [],
        PUSH: [],
        IN_APP: [],
      },
      isDeletable: false,
      definitionExists: false,
      isNew: true,
    };

    this.isCreateModalOpen = false;
    this.isLoading = true;
    this.templateService.createTemplateDefinition({ code: normalized })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.goToDetail(newItem, this.createChannelValue);
          if (!this.selectedCode || this.selectedCode.code !== normalized) return;
          this.selectedCode.definitionExists = true;
          if (response.data?.paramsSchema) {
            this.updateParamsSchema(response.data.paramsSchema);
          }
        },
        error: (error) => {
          console.error('Error creating template definition:', error);
        }
      });
  }

  goToDetail(code: NotificationCode | null, channel?: ChannelType): void {
    if (!code) return;
    this.selectedCode = code;
    this.viewMode = 'detail';
    this.availableChannelsFromApi = null;
    this.syncViewParam('detail');
    if (code.isNew) {
      this.selectedChannel = channel || this.getDefaultChannel(code);
      this.selectedChannelConfig = this.ensureChannelConfig(this.selectedChannel);
      this.refreshBreadcrumbs();
      return;
    }
    this.loadTemplateDetails(code.code, channel);
    this.refreshBreadcrumbs();
  }

  private loadTemplateDetails(code: string, preferredChannel?: ChannelType): void {
    if (!this.selectedCode) return;

    this.isLoading = true;
    const locale = this.getLocaleParam();

    // Load all templates for this code
    this.templateService.listTemplates({
      code,
      locale,
      active: true,
      page: 0,
      size: 100
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (!this.selectedCode) return;
          this.updateSelectedCodeWithTemplates(response.data || []);
          this.selectedCode.isNew = false;
          this.loadTemplateChannels(code);
          this.selectedChannel = preferredChannel || this.getDefaultChannel(this.selectedCode);
          this.selectedChannelConfig = this.ensureChannelConfig(this.selectedChannel);
          this.loadTemplateDefinition(code);
        },
        error: (error) => {
          console.error('Error loading template details:', error);
        }
      });
  }

  private updateSelectedCodeWithTemplates(templates: TemplateResponse[]): void {
    if (!this.selectedCode) return;

    const configs: ChannelConfig[] = [];
    const grouped = new Map<ChannelType, TemplateResponse[]>();

    templates.forEach(template => {
      const normalized = this.normalizeChannels([template.channel])[0];
      if (!normalized) return;
      const existing = grouped.get(normalized) || [];
      existing.push(template);
      grouped.set(normalized, existing);
    });

    grouped.forEach((items) => {
      if (!items.length) return;
      const activeItem = items.find(item => item.active);
      const latest = items.reduce((picked, item) => (
        item.templateVersion > picked.templateVersion ? item : picked
      ), items[0]);
      configs.push(this.mapTemplateToChannelConfig(activeItem ?? latest));
    });

    this.selectedCode.channels = configs;
  }

  private loadTemplateDefinition(code: string): void {
    this.templateService.getTemplateDefinition(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.data && this.selectedCode) {
            this.updateParamsSchema(response.data.paramsSchema);
            this.selectedCode.definitionExists = true;
            if (response.data.description !== undefined) {
              this.selectedCode.definitionDescription = response.data.description || '';
            }
          }
        },
        error: (error) => {
          console.error('Error loading template definition:', error);
          if (this.selectedCode) {
            this.selectedCode.definitionExists = false;
          }
        }
      });
  }

  private loadTemplateChannels(code: string): void {
    this.templateService.getTemplateChannels(code, this.getLocaleParam())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const available = response.data?.availableChannels || [];
          this.availableChannelsFromApi = this.normalizeChannels(available);
        },
        error: (error) => {
          console.error('Error loading template channels:', error);
          this.availableChannelsFromApi = null;
        }
      });
  }

  private updateParamsSchema(paramsSchema?: unknown): void {
    if (!this.selectedCode || !paramsSchema) return;

    const schema = this.coerceParamsSchema(paramsSchema);

    // Update schema for all channels
    ['EMAIL', 'PUSH', 'IN_APP'].forEach(channel => {
      this.selectedCode!.paramsSchemaByChannel[channel as ChannelType] = schema || {};
    });
  }

  private coerceParamsSchema(input: unknown): Record<string, string> {
    if (!input) return {};

    let raw: unknown = input;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (error) {
        console.error('Error parsing params schema:', error);
        return {};
      }
    }

    if (!raw || typeof raw !== 'object') return {};

    const result: Record<string, string> = {};
    Object.entries(raw as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result[key] = value;
        return;
      }
      if (value && typeof value === 'object' && 'description' in value) {
        const desc = (value as { description?: unknown }).description;
        result[key] = typeof desc === 'string' ? desc : '';
        return;
      }
      result[key] = '';
    });
    return result;
  }

  private normalizeChannels(channels: string[]): ChannelType[] {
    return channels
      .map(channel => channel.toUpperCase())
      .map(channel => channel === 'IN-APP' ? 'IN_APP' : channel)
      .filter((channel): channel is ChannelType => this.allChannels.includes(channel as ChannelType));
  }

  private formatDateTime(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const locale = this.currentLocale === 'en' ? 'en-US' : 'vi-VN';
    return date.toLocaleString(locale);
  }

  private getLocaleParam(): string {
    const candidate = `${this.currentLocale || this.translate.currentLang || 'vi'}`.trim();
    return candidate || 'vi';
  }

  private mapTemplateToChannelConfig(template: TemplateResponse, target?: ChannelConfig): ChannelConfig {
    const config: ChannelConfig = target || {
      channel: template.channel as ChannelType,
      active: template.active,
      format: template.format as ChannelFormat,
      subject: template.subject,
      content: template.content || '',
      version: template.templateVersion,
      updatedAt: this.formatDateTime(template.updatedAt),
      updatedBy: 'System',
    };

    config.id = template.id;
    config.channel = template.channel as ChannelType;
    config.active = template.active;
    config.format = template.format as ChannelFormat;
    config.subject = template.subject;
    config.content = template.content || '';
    config.version = template.templateVersion;
    config.updatedAt = this.formatDateTime(template.updatedAt);
    config.updatedBy = 'System';
    config.locale = template.locale;

    return config;
  }

  private upsertChannelConfig(config: ChannelConfig): void {
    if (!this.selectedCode) return;
    const index = this.selectedCode.channels.findIndex(item => item.channel === config.channel);
    if (index >= 0) {
      this.selectedCode.channels[index] = config;
    } else {
      this.selectedCode.channels.push(config);
    }
    if (this.selectedChannel === config.channel) {
      this.selectedChannelConfig = config;
    }
  }

  private buildParamsSchemaPayload(): Record<string, { description?: string }> | undefined {
    if (!this.selectedCode) return undefined;
    const schema = this.selectedCode.paramsSchemaByChannel[this.selectedChannel] || {};
    if (Object.keys(schema).length === 0) return undefined;
    return this.buildParamsSchemaObject(schema);
  }

  private buildParamsSchemaObject(schema: Record<string, string>): Record<string, { description?: string }> {
    return Object.entries(schema).reduce((acc, [key, description]) => {
      acc[key] = { description: description || '' };
      return acc;
    }, {} as Record<string, { description?: string }>);
  }

  private loadHistory(channel: ChannelType): void {
    if (!this.selectedCode) return;
    this.isHistoryLoading = true;
    this.templateService.getTemplateHistory(this.selectedCode.code, channel, this.getLocaleParam())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isHistoryLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (!this.selectedCode) return;
          this.selectedCode.historyByChannel[channel] = (response.data || [])
            .map(item => this.mapTemplateToChannelConfig(item));
        },
        error: (error) => {
          console.error('Error loading template history:', error);
        }
      });
  }

  backToList(syncUrl = true): void {
    this.viewMode = 'list';
    this.selectedCode = null;
    this.selectedChannelConfig = null;
    this.availableChannelsFromApi = null;
    this.refreshBreadcrumbs();
    this.loadTemplates();
    if (syncUrl) {
      this.syncViewParam('list');
    }
  }

  private syncViewParam(view: 'list' | 'detail'): void {
    const current = this.route.snapshot.queryParamMap.get('view');
    if (current === view) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view },
      queryParamsHandling: 'merge',
    });
  }

  selectChannel(channel: ChannelType): void {
    this.selectedChannel = channel;
    this.selectedChannelConfig = this.ensureChannelConfig(channel);
    this.applyRecommendedFormat();
    this.historySelection = null;
    if (this.dirtyByChannel[channel] == null) {
      this.dirtyByChannel[channel] = false;
    }
  }

  addChannel(channel: ChannelType | null): void {
    if (!this.selectedCode || !channel) return;
    this.addChannelValue = null;
    const existing = this.selectedCode.channels.find(item => item.channel === channel);
    if (existing) {
      existing.active = true;
      this.selectChannel(channel);
      return;
    }
    const newConfig: ChannelConfig = {
      channel,
      active: true,
      format: this.getRecommendedFormat(channel),
      subject: '',
      content: '',
      version: 0,
      updatedAt: '',
      updatedBy: 'Admin',
    };
    this.selectedCode.channels.push(newConfig);
    if (!this.selectedCode.paramsSchemaByChannel[channel]) {
      this.selectedCode.paramsSchemaByChannel[channel] = {};
    }
    if (!this.selectedCode.historyByChannel[channel]) {
      this.selectedCode.historyByChannel[channel] = [];
    }
    this.selectChannel(channel);
    this.markDirty();
  }

  onCreateCodeChange(value: string): void {
    this.createCodeValue = value?.toUpperCase() || '';
    if (this.createErrors.code) {
      this.createErrors.code = undefined;
    }
  }

  onCreateDescriptionChange(value: string): void {
    this.createDescriptionValue = value;
    if (this.createErrors.description) {
      this.createErrors.description = undefined;
    }
  }

  onCreateChannelChange(value: ChannelType): void {
    this.createChannelValue = value;
    if (this.createErrors.channel) {
      this.createErrors.channel = undefined;
    }
  }

  onChannelFilterChange(value: DropdownValue): void {
    this.channelFilter = this.toChannelFilter(value);
    this.onSearchChange();
  }

  onAddChannelChange(value: DropdownValue): void {
    this.addChannel(this.toChannelType(value));
  }

  onFormatChange(value: DropdownValue): void {
    if (!this.selectedChannelConfig) return;
    const format = this.toChannelFormat(value);
    if (!format) return;
    this.selectedChannelConfig.format = format;
    this.markDirty();
  }

  onCreateChannelDropdownChange(value: DropdownValue): void {
    const channel = this.toChannelType(value);
    if (!channel) return;
    this.onCreateChannelChange(channel);
  }

  get isCreateFormValid(): boolean {
    return !!this.createCodeValue.trim() && !!this.createDescriptionValue.trim() && !!this.createChannelValue;
  }

  removeSelectedChannel(): void {
    if (!this.selectedCode || !this.selectedChannelConfig) return;
    if (this.selectedChannelConfig.id) return;
    const channel = this.selectedChannel;
    const index = this.selectedCode.channels.findIndex(item => item.channel === channel);
    if (index >= 0) {
      this.selectedCode.channels.splice(index, 1);
    }
    this.dirtyByChannel[channel] = false;
    if (this.selectedCode.channels.length > 0) {
      const nextChannel = this.getDefaultChannel(this.selectedCode);
      this.selectChannel(nextChannel);
    } else {
      this.selectedChannelConfig = null;
    }
  }

  private getRecommendedFormat(channel: ChannelType): ChannelFormat {
    return channel === 'EMAIL' ? 'HTML' : 'TEXT';
  }

  private applyRecommendedFormat(): void {
    if (!this.selectedChannelConfig) return;
    this.selectedChannelConfig.format = this.getRecommendedFormat(this.selectedChannel);
  }

  get isFormatNonOptimal(): boolean {
    if (!this.selectedChannelConfig) return false;
    return this.selectedChannelConfig.format !== this.getRecommendedFormat(this.selectedChannel);
  }

  get isSelectedChannelNew(): boolean {
    return !!this.selectedChannelConfig && !this.selectedChannelConfig.id;
  }

  get canOpenHistory(): boolean {
    return !!this.selectedChannelConfig?.id || this.historyItems.length > 0;
  }

  get isRestoreDisabled(): boolean {
    if (!this.historySelection || !this.selectedChannelConfig) return true;
    return this.historySelection.version === this.selectedChannelConfig.version || this.isHistoryLoading;
  }

  onPageIndexChange(index: number): void {
    this.pageIndex = index;
    this.loadTemplates();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadTemplates();
  }

  onSearchChange(): void {
    this.pageIndex = 1;
    this.loadTemplates();
  }

  markDirty(): void {
    this.dirtyByChannel[this.selectedChannel] = true;
  }

  get isDirty(): boolean {
    return !!this.dirtyByChannel[this.selectedChannel];
  }

  setHtmlEditorMode(mode: 'design' | 'source'): void {
    this.htmlEditorMode = mode;
  }

  onHtmlInput(event: Event): void {
    if (!this.selectedChannelConfig) return;
    const target = event.target as HTMLElement;
    this.selectedChannelConfig.content = target.innerHTML;
    this.markDirty();
  }

  onHtmlSourceInput(event: Event): void {
    if (!this.selectedChannelConfig) return;
    const target = event.target as HTMLTextAreaElement;
    this.selectedChannelConfig.content = target.value;
    this.markDirty();
  }

  insertParam(key: string): void {
    if (!this.selectedChannelConfig || !key) return;
    const token = `{{${key}}}`;
    if (this.selectedChannelConfig.format === 'HTML' && this.htmlEditorMode === 'design') {
      const editor = this.getHtmlEditor();
      if (!editor) {
        this.selectedChannelConfig.content = (this.selectedChannelConfig.content || '') + token;
        this.markDirty();
        return;
      }

      editor.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(token);
        range.insertNode(textNode);

        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editor.insertAdjacentText('beforeend', token);
      }
      this.selectedChannelConfig.content = editor.innerHTML;
      this.markDirty();
      return;
    }

    const field = this.getContentTextField();
    if (field) {
      this.insertIntoTextField(field, token);
      field.focus();
    } else {
      this.selectedChannelConfig.content = (this.selectedChannelConfig.content || '') + token;
      this.markDirty();
    }
  }


  private getHtmlEditor(): HTMLElement | null {
    return document.querySelector('.html-editor-canvas') as HTMLElement | null;
  }

  private getContentTextField(): HTMLTextAreaElement | null {
    if (this.selectedChannelConfig?.format === 'HTML' && this.htmlEditorMode === 'source') {
      return document.querySelector('.html-source') as HTMLTextAreaElement | null;
    }
    return document.querySelector('.text-area-wrapper .custom-textarea') as HTMLTextAreaElement | null;
  }

  private insertIntoTextField(field: HTMLInputElement | HTMLTextAreaElement, token: string): void {
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;
    field.value = field.value.slice(0, start) + token + field.value.slice(end);
    const next = start + token.length;
    field.setSelectionRange(next, next);
    field.focus();
    if (this.selectedChannelConfig) {
      this.selectedChannelConfig.content = field.value;
    }
    this.markDirty();
  }

  execHtmlCommand(command: string): void {
    if (command === 'createLink') {
      const url = window.prompt('URL');
      if (!url) return;
      document.execCommand(command, false, url);
      return;
    }
    document.execCommand(command, false);
  }

  resizeIframe(iframe: HTMLIFrameElement): void {
    try {
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        const height = doc.documentElement.scrollHeight || doc.body.scrollHeight;
        iframe.style.height = `${height + 20}px`;
      }
    } catch (error) {
      console.warn('Khong the tu dong resize iframe:', error);
      iframe.style.height = '600px';
    }
  }

  hasChannelData(channel: ChannelType): boolean {
    if (!this.selectedCode) return false;
    return this.selectedCode.channels.some(item => item.channel === channel);
  }

  private getDefaultChannel(code: NotificationCode): ChannelType {
    const preferred: ChannelType[] = ['EMAIL', 'PUSH', 'IN_APP'];
    const available = code.channels.map(item => item.channel);
    return preferred.find(channel => available.includes(channel)) || 'EMAIL';
  }

  private ensureChannelConfig(channel: ChannelType): ChannelConfig | null {
    if (!this.selectedCode) return null;
    let config = this.selectedCode.channels.find(item => item.channel === channel);
    if (!config) {
      config = {
        channel,
        active: false,
        format: 'TEXT',
        subject: '',
        content: '',
        version: 0,
        updatedAt: '',
        updatedBy: 'Admin',
      };
      this.selectedCode.channels.push(config);
    }
    if (!this.selectedCode.paramsSchemaByChannel[channel]) {
      this.selectedCode.paramsSchemaByChannel[channel] = {};
    }
    if (!this.selectedCode.historyByChannel[channel]) {
      this.selectedCode.historyByChannel[channel] = [];
    }
    return config;
  }

  openParamsModal(): void {
    if (!this.selectedCode) return;
    this.paramsDraft = this.paramsList.map(item => ({
      key: item.key,
      description: item.description,
    }));
    this.paramsErrors = {};
    this.definitionDescriptionDraft = this.selectedCode.definitionDescription || '';
    this.isParamsModalOpen = true;
  }

  addParamRow(): void {
    this.paramsDraft.push({ key: '', description: '' });
  }

  removeParamRow(index: number): void {
    this.paramsDraft.splice(index, 1);
  }

  private validateParamKey(key: string): string | null {
    const trimmed = key.trim();
    if (!trimmed) return 'Ten bien la bat buoc';
    if (!/^[A-Za-z0-9_]+$/.test(trimmed)) {
      return 'Chi dung chu, so, dau gach duoi';
    }
    return null;
  }

  saveParams(): void {
    if (!this.selectedCode) return;
    const nextSchema: Record<string, string> = {};
    this.paramsErrors = {};
    this.paramsDraft.forEach((item, index) => {
      const keyError = this.validateParamKey(item.key);
      if (keyError) {
        this.paramsErrors[index] = keyError;
        return;
      }
      const key = item.key.trim();
      nextSchema[key] = item.description?.trim() || '';
    });
    if (Object.keys(this.paramsErrors).length > 0) {
      return;
    }
    const paramsSchema = this.buildParamsSchemaObject(nextSchema);
    const description = this.definitionDescriptionDraft.trim();
    const hasDefinition = !!this.selectedCode.definitionExists;
    const request$ = hasDefinition
      ? this.templateService.updateTemplateDefinition(this.selectedCode.code, { paramsSchema, description })
      : this.templateService.createTemplateDefinition({ code: this.selectedCode.code, paramsSchema, description });

    this.isLoading = true;
    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (this.selectedCode) {
            this.selectedCode.definitionExists = true;
            this.updateParamsSchema(response.data?.paramsSchema || paramsSchema);
            if (response.data?.description !== undefined) {
              this.selectedCode.definitionDescription = response.data.description || '';
            } else {
              this.selectedCode.definitionDescription = description;
            }
          }
          this.isParamsModalOpen = false;
          this.markDirty();
        },
        error: (error) => {
          console.error('Error saving template definition:', error);
        }
      });
  }

  openHistorySidebar(): void {
    if (!this.selectedCode || !this.selectedChannelConfig) return;
    this.isHistoryOpen = true;
    this.loadHistory(this.selectedChannel);
  }

  closeHistorySidebar(): void {
    this.isHistoryOpen = false;
    this.historySelection = null;
  }

  selectHistory(item: ChannelHistoryItem): void {
    this.historySelection = item;
  }

  openRestoreConfirm(item: ChannelHistoryItem): void {
    this.restoreCandidate = item;
    this.isRestoreConfirmOpen = true;
  }

  closeRestoreConfirm(): void {
    this.isRestoreConfirmOpen = false;
    this.restoreCandidate = null;
  }

  confirmRestoreHistory(): void {
    if (!this.restoreCandidate) return;
    this.restoreHistory(this.restoreCandidate);
    this.closeRestoreConfirm();
    this.closeHistorySidebar();
  }

  restoreHistory(item: ChannelHistoryItem): void {
    if (!this.selectedCode || !this.selectedChannelConfig) return;
    this.isHistoryLoading = true;
    this.templateService.restoreTemplate(this.selectedCode.code, {
      channel: this.selectedChannel,
      lang: this.getLocaleParam(),
      version: item.version,
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isHistoryLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            const updated = this.mapTemplateToChannelConfig(response.data, this.selectedChannelConfig || undefined);
            this.upsertChannelConfig(updated);
            this.dirtyByChannel[this.selectedChannel] = false;
          }
          this.closeHistorySidebar();
        },
        error: (error) => {
          console.error('Error restoring template history:', error);
        }
      });
  }

  openDeleteConfirm(item: NotificationCode): void {
    if (!item.isDeletable) return;
    this.deleteCandidate = item;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen = false;
    this.deleteCandidate = null;
  }

  confirmDelete(): void {
    if (!this.deleteCandidate) return;
    this.deleteCode(this.deleteCandidate);
    this.closeDeleteConfirm();
  }

  private deleteCode(item: NotificationCode): void {
    if (!item.isDeletable) return;
    this.isLoading = true;
    this.templateService.deleteTemplateDefinition(item.code)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error deleting template definition:', error);
        }
      });
  }

  saveConfig(): void {
    if (!this.selectedCode || !this.selectedChannelConfig) return;
    const locale = this.getLocaleParam();
    const paramsSchema = this.buildParamsSchemaPayload();
    const request = {
      code: this.selectedCode.code,
      channel: this.selectedChannel,
      locale,
      subject: this.selectedChannelConfig.subject,
      content: this.selectedChannelConfig.content || '',
      format: this.selectedChannelConfig.format,
      active: this.selectedChannelConfig.active,
      paramsSchema,
    };

    const templateId = this.selectedChannelConfig.id;
    const request$ = templateId
      ? this.templateService.updateTemplate(String(templateId), request)
      : this.templateService.createTemplate(request);

    this.isLoading = true;
    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            const updated = this.mapTemplateToChannelConfig(response.data, this.selectedChannelConfig || undefined);
            this.upsertChannelConfig(updated);
            this.dirtyByChannel[this.selectedChannel] = false;
            if (this.selectedCode) {
              this.selectedCode.isNew = false;
            }
            this.loadTemplateChannels(this.selectedCode!.code);
            this.loadTemplates();
          }
        },
        error: (error) => {
          console.error('Error saving template:', error);
        }
      });
  }

  private toChannelType(value: DropdownValue): ChannelType | null {
    return value === 'EMAIL' || value === 'PUSH' || value === 'IN_APP' ? value : null;
  }

  private toChannelFilter(value: DropdownValue): ChannelFilter {
    return value === 'ALL' || value === 'EMAIL' || value === 'PUSH' || value === 'IN_APP' ? value : 'ALL';
  }

  private toChannelFormat(value: DropdownValue): ChannelFormat | null {
    return value === 'HTML' || value === 'TEXT' ? value : null;
  }
}



