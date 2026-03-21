import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shared-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shared-search.component.html',
  styleUrls: ['./shared-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedSearchComponent {
  private readonly destroyRef = inject(DestroyRef);
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  @Input() value = '';
  @Input() placeholder = 'Tìm kiếm...';
  @Input() width = '280px';
  @Input() variant: 'outline' | 'filled' = 'outline';
  @Input() debounceMs = 0;

  @Output() valueChange = new EventEmitter<string>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
    });
  }

  onValueChange(newValue: string) {
    if (this.debounceMs <= 0) {
      this.valueChange.emit(newValue);
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.valueChange.emit(newValue);
    }, this.debounceMs);
  }
}
