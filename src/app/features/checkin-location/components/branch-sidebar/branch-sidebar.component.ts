import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BranchCheckinConfig } from '../../../../models/checkin-config.model';

@Component({
  selector: 'app-branch-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, NzInputModule, NzIconModule],
  template: `
    <aside class="master-panel">
      <div class="search-box">
        <nz-input-group [nzPrefix]="prefixIcon">
          <input type="text" nz-input placeholder="Tìm chi nhánh..." [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)" />
        </nz-input-group>
        <ng-template #prefixIcon><span nz-icon nzType="search"></span></ng-template>
      </div>

      <div class="branch-list">
        @for (branch of filteredBranches(); track branch.id) {
          <div class="branch-item" [class.active]="selectedBranchId === branch.id" (click)="onSelect(branch)">
            <div class="branch-icon">
              <span icon class="custom-icon-box-iso"></span>
            </div>
            <div class="branch-info">
              <div class="branch-name">{{ branch.name }}</div>
              <div class="branch-status" [class.inactive]="!branch.isActive">
                {{ branch.isActive ? 'Hoạt động' : 'Tạm dừng' }}
              </div>
            </div>
            <span nz-icon nzType="chevron-right" class="arrow-icon"></span>
          </div>
        } @empty {
          <div class="empty-list">Không tìm thấy chi nhánh</div>
        }
      </div>
    </aside>
  `,
  styles: [`
    .master-panel {
      width: 320px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
      padding: 20px;
      flex-shrink: 0;
      height: 100%;
    }

    .search-box {
      ::ng-deep .ant-input-affix-wrapper {
        border-radius: 10px;
        padding: 8px 12px;
        background: var(--app-color-surface-warm-100);
        border: none;

        &:hover, &-focused {
          box-shadow: 0 0 0 2px rgba(var(--app-color-primary-rgb), 0.1);
        }
      }
    }

    .branch-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 4px;

      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-thumb { background: var(--app-color-surface-warm-300); border-radius: 2px; }
    }

    .branch-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;

      &:hover { background: var(--app-color-surface-warm-100); }

      &.active {
        background: var(--app-color-primary-100, #f0f7ff);
        border-color: var(--app-color-primary-200, #bae0ff);
        .branch-icon { background: var(--app-color-primary); color: white; }
        .branch-name { color: var(--app-color-primary); font-weight: 600; }
        .arrow-icon { color: var(--app-color-primary); opacity: 1; transform: translateX(0); }
      }
    }

    .branch-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--app-color-surface-warm-200);
      border-radius: 10px;
      color: var(--app-color-text-muted);
      transition: all 0.2s;
    }

    .branch-info { flex: 1; }
    .branch-name { font-size: 14px; font-weight: 500; color: var(--app-color-text-main); margin-bottom: 2px; }
    .branch-status {
      font-size: 11px; font-weight: 600; text-transform: uppercase; color: #10b981;
      &.inactive { color: #ef4444; }
    }
    .arrow-icon { font-size: 12px; color: var(--app-color-text-muted); opacity: 0; transform: translateX(-4px); transition: all 0.2s; }
    .empty-list { padding: 32px; text-align: center; color: var(--app-color-text-muted); font-size: 14px; }
  `]
})
export class BranchSidebarComponent {
  @Input() branches: BranchCheckinConfig[] = [];
  @Input() selectedBranchId: string | undefined;
  @Output() selectBranch = new EventEmitter<BranchCheckinConfig>();

  protected readonly searchQuery = signal('');

  protected readonly filteredBranches = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.branches;
    return this.branches.filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.description?.toLowerCase().includes(query)
    );
  });

  protected onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  protected onSelect(branch: BranchCheckinConfig): void {
    this.selectBranch.emit(branch);
  }
}
