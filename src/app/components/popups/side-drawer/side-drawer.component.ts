import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-side-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './side-drawer.component.html',
  styleUrl: './side-drawer.component.scss',
})
export class SideDrawerComponent {
  @Input() isVisible = false;
  @Input() title = '';
  @Input() width = '440px';

  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  handleClose(): void {
    this.isVisible = false;
    this.isVisibleChange.emit(false);
    this.close.emit();
  }
}
