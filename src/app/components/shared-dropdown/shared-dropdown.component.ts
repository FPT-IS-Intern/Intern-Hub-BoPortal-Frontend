import { Component, EventEmitter, Input, Output, HostListener, forwardRef, ElementRef, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

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
  styleUrl: './shared-dropdown.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SharedDropdownComponent),
      multi: true
    }
  ]
})
export class SharedDropdownComponent implements ControlValueAccessor, OnInit {
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // console.log('SharedDropdownComponent initialized with options:', this.options);
  }

  @Input() set options(val: DropdownOption[]) {
    this._options = val || [];
    // console.log('Dropdown options updated:', this._options);
    this.cdr.markForCheck();
  }
  get options(): DropdownOption[] {
    return this._options;
  }
  private _options: DropdownOption[] = [];

  @Input() placeholder: string = 'Chọn một mục';
  @Input() icon: string = '';
  @Input() width: string = '100%';

  @Output() valueChange = new EventEmitter<any>();

  protected isOpen = false;
  protected internalValue: any = null;

  // ControlValueAccessor methods
  onChange: any = () => {};
  onTouched: any = () => {};

  @Input() set value(val: any) {
    this.internalValue = val;
    this.cdr.markForCheck();
  }
  get value(): any {
    return this.internalValue;
  }

  writeValue(value: any): void {
    this.internalValue = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Implement if needed
  }

  protected get selectedLabel(): string {
    if (!this.options || this.options.length === 0) return this.placeholder;
    const selected = this.options.find(opt => opt.value === this.internalValue);
    return selected ? selected.label : this.placeholder;
  }

  protected get selectedOption() {
    return this.options.find(opt => opt.value === this.internalValue);
  }

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  protected selectOption(opt: DropdownOption): void {
    this.internalValue = opt.value;
    this.isOpen = false;
    this.valueChange.emit(this.internalValue);
    this.onChange(this.internalValue);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen) {
        this.isOpen = false;
        this.cdr.markForCheck();
      }
    }
  }
}
