import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalPopup } from '@/components/popups/modal-popup/modal-popup';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-create-resource-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalPopup, TranslateModule],
  templateUrl: './create-resource-dialog.component.html',
  styleUrl: './create-resource-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateResourceDialogComponent implements OnChanges {
  @Input() isVisible = false;
  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<{ name: string; code: string; description: string }>();

  name = '';
  code = '';
  description = '';
  isTriedToSave = false;

  get isValid(): boolean {
    return this.name.trim().length > 0 && this.code.trim().length > 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && !changes['isVisible'].currentValue) {
      this.resetForm();
    }
  }

  onSave(): void {
    this.isTriedToSave = true;
    if (!this.isValid) return;
    this.save.emit({
      name: this.name.trim(),
      code: this.code.trim(),
      description: this.description.trim(),
    });
  }

  onVisibilityChange(visible: boolean): void {
    this.isVisible = visible;
    this.isVisibleChange.emit(visible);
    if (!visible) this.resetForm();
  }

  private resetForm(): void {
    this.name = '';
    this.code = '';
    this.description = '';
    this.isTriedToSave = false;
  }
}


