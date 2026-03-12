import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NoDataComponent } from '../../../../components/no-data/no-data.component';
import { AttendanceLocation } from '../../../../models/checkin-config.model';

@Component({
  selector: 'app-location-tab',
  standalone: true,
  imports: [CommonModule, NzIconModule, NoDataComponent],
  templateUrl: './location-tab.component.html',
  styleUrl: './location-tab.component.scss'
})
export class LocationTabComponent {
  @Input() locations: AttendanceLocation[] = [];
  @Output() addLocation = new EventEmitter<void>();
  @Output() editLocation = new EventEmitter<AttendanceLocation>();
  @Output() deleteLocation = new EventEmitter<AttendanceLocation>();
}
