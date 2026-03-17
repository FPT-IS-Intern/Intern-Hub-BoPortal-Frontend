import { Component, Output, EventEmitter, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoDataComponent } from '../../../../components/no-data/no-data.component';
import { SharedSearchComponent } from '../../../../components/shared-search/shared-search.component';
import { IPRange } from '../../../../models/checkin-config.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ip-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, NoDataComponent, SharedSearchComponent, TranslateModule],
  templateUrl: './ip-tab.component.html',
  styleUrl: './ip-tab.component.scss'
})
export class IpTabComponent {
  ipRanges = input<IPRange[]>([]);
  showEmptyState = input<boolean>(true);
  @Output() addIP = new EventEmitter<void>();
  @Output() editIP = new EventEmitter<IPRange>();
  @Output() deleteIP = new EventEmitter<IPRange>();

  searchTerm = signal('');

  filteredIpRanges = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const ipRanges = this.ipRanges() ?? [];
    if (!term) return ipRanges;
    return ipRanges.filter(range =>
      (range.name?.toLowerCase() || '').includes(term) ||
      (range.ipPrefix?.toLowerCase() || '').includes(term) ||
      (range.description?.toLowerCase() || '').includes(term)
    );
  });

  protected readonly hasIpRanges = computed(() => this.filteredIpRanges().length > 0);
}
