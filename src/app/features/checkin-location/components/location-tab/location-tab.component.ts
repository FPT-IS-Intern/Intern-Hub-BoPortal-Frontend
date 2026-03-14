import { Component, Output, EventEmitter, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NoDataComponent } from '../../../../components/no-data/no-data.component';
import { SharedSearchComponent } from '../../../../components/shared-search/shared-search.component';
import { AttendanceLocation } from '../../../../models/checkin-config.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-location-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NoDataComponent, SharedSearchComponent, TranslateModule],
  templateUrl: './location-tab.component.html',
  styleUrl: './location-tab.component.scss'
})
export class LocationTabComponent {
  locations = input<AttendanceLocation[]>([]);
  @Output() addLocation = new EventEmitter<void>();
  @Output() editLocation = new EventEmitter<AttendanceLocation>();
  @Output() deleteLocation = new EventEmitter<AttendanceLocation>();

  searchTerm = signal('');
  protected readonly canCreate = computed(() => (this.locations()?.length ?? 0) === 0);

  filteredLocations = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const locations = this.locations();
    if (!term) return locations;
    return locations.filter(loc =>
      loc.name.toLowerCase().includes(term) ||
      loc.latitude.toString().includes(term) ||
      loc.longitude.toString().includes(term)
    );
  });
}
