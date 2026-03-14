import { Component, EventEmitter, Input, Output, HostListener, ElementRef, inject, OnInit, OnDestroy, forwardRef, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-shared-date-time',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shared-date-time.component.html',
  styleUrl: './shared-date-time.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SharedDateTimePickerComponent),
      multi: true
    }
  ]
})
export class SharedDateTimePickerComponent implements OnInit, OnDestroy, ControlValueAccessor, AfterViewInit {
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('hourCol') hourCol?: ElementRef;
  @ViewChild('minCol') minCol?: ElementRef;

  @Input() placeholder = 'Chọn thời gian hẹn giờ';
  @Input() isReadOnly = false;

  protected viewDate = new Date();
  protected calendarDays: CalendarDay[] = [];
  protected weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  protected monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  protected selectedDate: Date | null = null;
  protected selectedHour = 0;
  protected selectedMinute = 0;

  protected viewMode: 'day' | 'month' | 'year' = 'day';
  protected years: number[] = [];

  protected hours = Array.from({ length: 24 }, (_, i) => i);
  protected minutes = Array.from({ length: 60 }, (_, i) => i);

  onChange: any = () => { };
  onTouched: any = () => { };

  ngOnInit(): void {
    const now = new Date();
    this.selectedHour = now.getHours();
    this.selectedMinute = now.getMinutes();
    this.generateCalendar();
    this.generateYears();

    // Add capture phase listener to handle clicks even if propagation is stopped by modals
    document.addEventListener('click', this.handleOutsideClick, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleOutsideClick, true);
  }

  private handleOutsideClick = (event: MouseEvent) => {
    if (!this.isOpen) return;

    const clickTarget = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(clickTarget);

    if (!clickedInside) {
      this.isOpen = false;
      this.cdr.markForCheck();
    }
  };
  // ... (skip)
  protected switchView(mode: 'day' | 'month' | 'year'): void {
    if (this.viewMode === mode) {
      this.viewMode = 'day';
    } else {
      this.viewMode = mode;
      if (mode === 'year') {
        setTimeout(() => this.scrollToActiveYear(), 0);
      }
    }
  }

  protected selectMonth(month: number): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), month, 1);
    this.generateCalendar();
    this.viewMode = 'day';
  }

  protected selectYear(year: number): void {
    this.viewDate = new Date(year, this.viewDate.getMonth(), 1);
    this.generateCalendar();
    this.viewMode = 'day';
  }

  private generateYears(): void {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);
  }

  private scrollToActiveYear(): void {
    const container = this.elementRef.nativeElement.querySelector('.year-grid');
    const activeItem = container?.querySelector('.year-item.active');
    if (container && activeItem) {
      container.scrollTop = activeItem.offsetTop - container.clientHeight / 2 + activeItem.clientHeight / 2;
    }
  }

  ngAfterViewInit(): void {
    this.scrollToSelected();
  }

  protected isOpen = false;

  protected toggle(): void {
    if (this.isReadOnly) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      if (!this.selectedDate) {
        this.selectedDate = new Date();
        this.selectedHour = this.selectedDate.getHours();
        this.selectedMinute = this.selectedDate.getMinutes();
        this.updateValue();
        this.generateCalendar();
      }
      setTimeout(() => this.scrollToSelected(), 0);
    }
  }

  // Removed document:click HostListener in favor of capture phase listener in ngOnInit

  protected get scheduleDisplay(): string {
    if (!this.selectedDate) return this.placeholder;

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return `${this.selectedDate.toLocaleString('vi-VN', options)}`;
  }

  protected clear(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedDate = null;
    this.updateValue();
    this.generateCalendar();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value) {
      this.selectedDate = new Date(value);
      this.selectedHour = this.selectedDate.getHours();
      this.selectedMinute = this.selectedDate.getMinutes();
      this.viewDate = new Date(this.selectedDate);
    } else {
      this.selectedDate = null;
    }
    this.generateCalendar();
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  private isScrolling = false;
  private scrollTimeout: any;

  protected onScroll(type: 'hour' | 'minute', event: any): void {
    const container = event.target;
    const itemHeight = 40; // matches SCSS
    const index = Math.round((container.scrollTop) / itemHeight);

    if (type === 'hour') {
      const newHour = this.hours[index];
      if (newHour !== undefined && newHour !== this.selectedHour) {
        this.selectedHour = newHour;
        this.updateTimeFromScroll();
      }
    } else {
      const newMinute = this.minutes[index];
      if (newMinute !== undefined && newMinute !== this.selectedMinute) {
        this.selectedMinute = newMinute;
        this.updateTimeFromScroll();
      }
    }

    // Set flag to prevent scrollToSelected from triggering during manual scroll
    this.isScrolling = true;
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 150);
  }

  private updateTimeFromScroll(): void {
    if (this.selectedDate) {
      const newDate = new Date(this.selectedDate);
      newDate.setHours(this.selectedHour, this.selectedMinute);
      this.selectedDate = newDate;
      this.updateValue();
      this.cdr.markForCheck();
    }
  }

  protected selectDay(day: CalendarDay): void {
    const newDate = new Date(day.date);
    newDate.setHours(this.selectedHour, this.selectedMinute, 0, 0);
    this.selectedDate = newDate;
    this.updateValue();
    this.generateCalendar();
  }

  protected selectHour(h: number): void {
    this.selectedHour = h;
    if (this.selectedDate) {
      const newDate = new Date(this.selectedDate);
      newDate.setHours(h);
      this.selectedDate = newDate;
      this.updateValue();
    }
    this.scrollToSelected();
  }

  protected selectMinute(m: number): void {
    this.selectedMinute = m;
    if (this.selectedDate) {
      const newDate = new Date(this.selectedDate);
      newDate.setMinutes(m);
      this.selectedDate = newDate;
      this.updateValue();
    }
    this.scrollToSelected();
  }

  private scrollToSelected(): void {
    if (this.isScrolling) return;

    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      if (this.hourCol) {
        const container = this.hourCol.nativeElement.querySelector('.scroll-container');
        if (container) {
          container.scrollTop = this.selectedHour * 40;
        }
      }
      if (this.minCol) {
        const container = this.minCol.nativeElement.querySelector('.scroll-container');
        if (container) {
          container.scrollTop = this.selectedMinute * 40;
        }
      }
    }, 0);
  }

  private updateValue(): void {
    this.onChange(this.selectedDate);
  }

  protected prevMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  protected nextMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  protected generateCalendar(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const current = new Date(start);
      current.setDate(current.getDate() + i);
      current.setHours(0, 0, 0, 0);

      const isSelected = !!this.selectedDate &&
        current.getDate() === this.selectedDate.getDate() &&
        current.getMonth() === this.selectedDate.getMonth() &&
        current.getFullYear() === this.selectedDate.getFullYear();

      days.push({
        date: current,
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === today.getTime(),
        isSelected: isSelected
      });
    }
    this.calendarDays = days;
  }
}
