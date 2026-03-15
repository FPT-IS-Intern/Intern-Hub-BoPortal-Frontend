import { Component, Output, EventEmitter, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SharedSearchComponent } from '../../../../components/shared-search/shared-search.component';
import { BranchCheckinConfig } from '../../../../models/checkin-config.model';

@Component({
  selector: 'app-branch-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SharedSearchComponent],
  templateUrl: './branch-sidebar.component.html',
  styleUrl: './branch-sidebar.component.scss'
})
export class BranchSidebarComponent {
  branches = input<BranchCheckinConfig[]>([]);
  selectedBranchId = input<string | undefined>();
  @Output() selectBranch = new EventEmitter<BranchCheckinConfig>();
  @Output() manageBranches = new EventEmitter<void>();

  protected readonly searchQuery = signal('');

  protected readonly filteredBranches = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const branches = this.branches();
    if (!query) return branches;
    return branches.filter(b =>
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
