import { Component, EventEmitter, Input, Output, HostListener, forwardRef, ElementRef, inject, ChangeDetectorRef, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type DropdownValue = string | number | boolean | null;

export interface DropdownOption {
  label: string;
  value: DropdownValue;
  icon?: string;
  description?: string;
}

import { TranslateModule } from '@ngx-translate/core';
import { NoDataComponent } from '@/components/no-data/no-data.component';
import { SharedDropdownCoordinatorService } from './shared-dropdown-coordinator.service';

@Component({
  selector: 'app-shared-dropdown',
  standalone: true,
  imports: [CommonModule, NoDataComponent, TranslateModule],
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
  private destroyRef = inject(DestroyRef);
  private coordinator = inject(SharedDropdownCoordinatorService);

  private static nextInstanceId = 1;
  private readonly instanceId = `shared-dropdown-${SharedDropdownComponent.nextInstanceId++}`;

  ngOnInit(): void {
    // console.log('SharedDropdownComponent initialized with options:', this.options);
    this.coordinator.opened$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((openedId) => {
        if (openedId !== this.instanceId && this.isOpen) {
          this.isOpen = false;
          this.cdr.markForCheck();
        }
      });
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

  @Input() placeholder: string = 'Ch\u1ECDn m\u1ED9t m\u1EE5c';
  @Input() icon: string = '';
  @Input() width: string = '100%';
  @Input() direction: 'auto' | 'up' | 'down' = 'auto';
  @Input() maxLabelChars = 0;

  @Output() valueChange = new EventEmitter<DropdownValue>();

  protected isOpen = false;
  protected overlayReady = false;
  protected overlayStyle: Record<string, string> = {};
  protected internalValue: DropdownValue = null;

  // ControlValueAccessor methods
  onChange: (value: DropdownValue) => void = () => {};
  onTouched: () => void = () => {};

  @Input() set value(val: DropdownValue) {
    this.internalValue = val;
    this.cdr.markForCheck();
  }
  get value(): DropdownValue {
    return this.internalValue;
  }

  writeValue(value: DropdownValue): void {
    this.internalValue = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: DropdownValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
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

  protected get selectedOption(): DropdownOption | undefined {
    return this.options.find(opt => opt.value === this.internalValue);
  }

  protected get selectedDisplayLabel(): string {
    return this.truncateLabel(this.selectedLabel);
  }

  protected get selectedTooltip(): string {
    const selected = this.selectedOption;
    return this.buildOptionTooltip(selected?.label || this.selectedLabel, selected?.description);
  }

  protected getOptionDisplayLabel(opt: DropdownOption): string {
    return this.truncateLabel(opt.label);
  }

  protected getOptionTooltip(opt: DropdownOption): string {
    return this.buildOptionTooltip(opt.label, opt.description);
  }

  private truncateLabel(label: string): string {
    const max = Number(this.maxLabelChars) || 0;
    if (max <= 0 || !label || label.length <= max) {
      return label;
    }
    return `${label.slice(0, max)}...`;
  }

  private buildOptionTooltip(label: string, description?: string): string {
    const desc = (description || '').trim();
    return desc ? `${label}\n${desc}` : label;
  }

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    const nextState = !this.isOpen;
    if (nextState) {
      this.coordinator.notifyOpened(this.instanceId);
    }
    this.isOpen = nextState;
    if (this.isOpen) {
      this.overlayReady = false;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.updateOverlayPosition();
        this.overlayReady = true;
        this.cdr.markForCheck();
      }, 0);
    }
  }

  protected selectOption(opt: DropdownOption): void {
    this.internalValue = opt.value;
    this.isOpen = false;
    this.overlayReady = false;
    this.valueChange.emit(this.internalValue);
    this.onChange(this.internalValue);
    this.onTouched();
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDownOutside(event: MouseEvent): void {
    this.closeIfOutside(event.target);
  }

  @HostListener('document:touchstart', ['$event'])
  onTouchStartOutside(event: TouchEvent): void {
    this.closeIfOutside(event.target);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    // Fallback in case some parents stop mousedown propagation.
    this.closeIfOutside(event.target);
  }

  private closeIfOutside(target: EventTarget | null): void {
    if (!target) return;
    if (this.elementRef.nativeElement.contains(target)) return;
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlayReady = false;
    this.cdr.markForCheck();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.isOpen) return;
    this.updateOverlayPosition();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.isOpen) return;
    this.updateOverlayPosition();
  }

  private updateOverlayPosition(): void {
    const hostEl = this.elementRef.nativeElement as HTMLElement;
    const triggerEl = hostEl.querySelector('.dropdown-trigger') as HTMLElement | null;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const gap = 6;
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const viewportW = window.innerWidth || document.documentElement.clientWidth;

    const availableBelow = Math.max(0, viewportH - rect.bottom - gap - 8);
    const availableAbove = Math.max(0, rect.top - gap - 8);

    const wantUp =
      this.direction === 'up' ? true :
      this.direction === 'down' ? false :
      (availableBelow < 220 && availableAbove > availableBelow);

    const maxOverlay = 300;
    const maxHeight = Math.max(140, Math.min(maxOverlay, wantUp ? availableAbove : availableBelow));

    const minLeft = 8;
    const maxLeft = Math.max(minLeft, viewportW - minLeft - rect.width);
    const left = Math.min(Math.max(rect.left, minLeft), maxLeft);
    const width = Math.min(rect.width, viewportW - minLeft * 2);

    const style: Record<string, string> = {
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
    };

    if (wantUp) {
      style['bottom'] = `${viewportH - rect.top + gap}px`;
      style['top'] = 'auto';
    } else {
      style['top'] = `${rect.bottom + gap}px`;
      style['bottom'] = 'auto';
    }

    this.overlayStyle = style;
  }
}
