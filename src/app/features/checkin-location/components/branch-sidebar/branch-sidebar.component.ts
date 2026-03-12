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
  templateUrl: './branch-sidebar.component.html',
  styleUrl: './branch-sidebar.component.scss'
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
