import { Component, EventEmitter, Input, Output, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
  label: string;
  value: any;
  icon?: string;
}

@Component({
  selector: 'app-shared-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shared-dropdown.component.html',
  styleUrl: './shared-dropdown.component.scss'
})
export class SharedDropdownComponent {
  private elementRef = inject(ElementRef);

  @Input() options: DropdownOption[] = [];
  @Input() value: any = null;
  @Input() placeholder: string = 'Select option';
  @Input() icon: string = '';
  @Input() width: string = '200px';

  @Output() valueChange = new EventEmitter<any>();

  protected isOpen = false;

  protected get selectedLabel(): string {
    const selected = this.options.find(opt => opt.value === this.value);
    return selected ? selected.label : this.placeholder;
  }

  protected toggle(): void {
    this.isOpen = !this.isOpen;
  }

  protected selectOption(opt: DropdownOption): void {
    this.value = opt.value;
    this.valueChange.emit(this.value);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
