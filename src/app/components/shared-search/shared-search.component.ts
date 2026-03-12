import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-shared-search',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule],
  templateUrl: './shared-search.component.html',
  styleUrls: ['./shared-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedSearchComponent {
  @Input() value = '';
  @Input() placeholder = 'Tìm kiếm...';
  @Input() width = '280px';
  @Input() variant: 'outline' | 'filled' = 'outline';

  @Output() valueChange = new EventEmitter<string>();

  onValueChange(newValue: string) {
    this.valueChange.emit(newValue);
  }
}
