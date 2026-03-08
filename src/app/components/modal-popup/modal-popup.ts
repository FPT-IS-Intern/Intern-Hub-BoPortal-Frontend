import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-popup.html',
  styleUrl: './modal-popup.scss',
})
export class ModalPopup {
  @Input() isVisible: boolean = false;
  @Input() title: string = '';
  @Input() cancelText: string = 'Cancel';
  @Input() saveText: string = 'Lưu';
  @Input() showFooter: boolean = true;
  @Input() okDisabled: boolean = false;

  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  handleCancel(): void {
    this.isVisible = false;
    this.isVisibleChange.emit(this.isVisible);
    this.cancel.emit();
  }

  handleSave(): void {
    if (this.okDisabled) return;
    this.save.emit();
  }
}
