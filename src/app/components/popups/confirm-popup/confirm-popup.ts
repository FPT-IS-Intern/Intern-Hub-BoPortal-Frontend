import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-popup.html',
  styleUrl: './confirm-popup.scss',
})
export class ConfirmPopup {
  @Input() isVisible: boolean = false;
  @Input() title: string = 'Lưu lại';
  @Input() message: string = 'Bạn có muốn lưu các thay đổi ?';
  @Input() cancelText: string = 'Không';
  @Input() confirmText: string = 'Có';

  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  handleCancel(): void {
    this.isVisible = false;
    this.isVisibleChange.emit(this.isVisible);
    this.cancel.emit();
  }

  handleConfirm(): void {
    this.confirm.emit();
  }
}
