import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NoDataComponent } from '../../../../components/no-data/no-data.component';
import { SharedSearchComponent } from '../../../../components/shared-search/shared-search.component';
import { IPRange } from '../../../../models/checkin-config.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ip-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NoDataComponent, SharedSearchComponent, TranslateModule],
  templateUrl: './ip-tab.component.html',
  styleUrl: './ip-tab.component.scss'
})
export class IpTabComponent {
  @Input() ipRanges: IPRange[] = [];
  @Output() addIP = new EventEmitter<void>();
  @Output() editIP = new EventEmitter<IPRange>();
  @Output() deleteIP = new EventEmitter<IPRange>();

  searchTerm = signal('');

  filteredIpRanges = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.ipRanges;
    return this.ipRanges.filter(range =>
      range.name.toLowerCase().includes(term) ||
      range.ipPrefix.toLowerCase().includes(term) ||
      (range.description && range.description.toLowerCase().includes(term))
    );
  });
}
