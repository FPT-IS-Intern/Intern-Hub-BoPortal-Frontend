import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NoDataComponent } from '../../../../components/no-data/no-data.component';
import { IPRange } from '../../../../models/checkin-config.model';

@Component({
  selector: 'app-ip-tab',
  standalone: true,
  imports: [CommonModule, NzIconModule, NoDataComponent],
  templateUrl: './ip-tab.component.html',
  styleUrl: './ip-tab.component.scss'
})
export class IpTabComponent {
  @Input() ipRanges: IPRange[] = [];
  @Output() addIP = new EventEmitter<void>();
  @Output() editIP = new EventEmitter<IPRange>();
  @Output() deleteIP = new EventEmitter<IPRange>();
}
