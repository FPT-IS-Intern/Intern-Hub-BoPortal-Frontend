import { Component, EventEmitter, Input, Output, HostListener, ElementRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DateRange {
  from: string | null;
  to: string | null;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isStart: boolean;
  isEnd: boolean;
}

@Component({
  selector: 'app-shared-date-range',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shared-date-range.component.html',
  styleUrl: './shared-date-range.component.scss'
})
export class SharedDateRangeComponent implements OnInit {
  private elementRef = inject(ElementRef);

  @Input() dateRange: DateRange = { from: null, to: null };
  @Output() dateRangeChange = new EventEmitter<DateRange>();

  protected isOpen = false;
  protected viewMode: 'days' | 'months' | 'years' = 'days';
  protected viewDate = new Date();
  protected calendarDays: CalendarDay[] = [];
  protected weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  protected monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  protected yearRange: number[] = [];

  protected startDate: Date | null = null;
  protected endDate: Date | null = null;

  ngOnInit(): void {
    if (this.dateRange.from) this.startDate = new Date(this.dateRange.from);
    if (this.dateRange.to) this.endDate = new Date(this.dateRange.to);
    this.generateCalendar();
    this.generateYearRange();
  }

  protected toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
        this.viewMode = 'days';
        this.viewDate = this.startDate || new Date();
        this.generateCalendar();
    }
  }

  protected switchView(mode: 'days' | 'months' | 'years'): void {
    this.viewMode = mode;
    if (mode === 'years') this.generateYearRange();
  }

  protected selectMonth(month: number): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), month, 1);
    this.viewMode = 'days';
    this.generateCalendar();
  }

  protected selectYear(year: number): void {
    this.viewDate = new Date(year, this.viewDate.getMonth(), 1);
    this.viewMode = 'months';
  }

  protected generateYearRange(): void {
    const currentYear = this.viewDate.getFullYear();
    const startYear = currentYear - (currentYear % 12);
    this.yearRange = [];
    for (let i = 0; i < 12; i++) {
        this.yearRange.push(startYear + i);
    }
  }

  protected nextYears(): void {
    this.viewDate = new Date(this.viewDate.getFullYear() + 12, this.viewDate.getMonth(), 1);
    this.generateYearRange();
  }

  protected prevYears(): void {
    this.viewDate = new Date(this.viewDate.getFullYear() - 12, this.viewDate.getMonth(), 1);
    this.generateYearRange();
  }

  protected generateCalendar(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Starting day of calendar (padded with previous month)
    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
        const current = new Date(start);
        current.setDate(current.getDate() + i);
        current.setHours(0,0,0,0);

        const isStart = !!this.startDate && current.getTime() === this.startDate.getTime();
        const isEnd = !!this.endDate && current.getTime() === this.endDate.getTime();
        const isInRange = !!this.startDate && !!this.endDate && 
                         current > this.startDate && current < this.endDate;

        days.push({
            date: current,
            isCurrentMonth: current.getMonth() === month,
            isToday: current.getTime() === today.getTime(),
            isSelected: isStart || isEnd,
            isInRange: isInRange,
            isStart: isStart,
            isEnd: isEnd
        });
    }
    this.calendarDays = days;
  }

  protected selectDay(day: CalendarDay): void {
    const selected = new Date(day.date);
    selected.setHours(0,0,0,0);

    if (!this.startDate || (this.startDate && this.endDate)) {
        this.startDate = selected;
        this.endDate = null;
    } else if (selected < this.startDate) {
        this.endDate = this.startDate;
        this.startDate = selected;
    } else {
        this.endDate = selected;
        this.isOpen = false; // Close when range is complete
    }

    this.updateOutput();
    this.generateCalendar();
    
    if (this.startDate && this.endDate) {
        // Close on range complete? Or keep open? Let's keep open for a moment
    }
  }

  protected prevMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  protected nextMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  protected clear(): void {
    this.startDate = null;
    this.endDate = null;
    this.updateOutput();
    this.generateCalendar();
  }

  private updateOutput(): void {
    this.dateRange = {
        from: this.startDate ? this.formatDate(this.startDate) : null,
        to: this.endDate ? this.formatDate(this.endDate) : null
    };
    this.dateRangeChange.emit(this.dateRange);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  protected get rangeDisplay(): string {
    if (!this.startDate) return 'Chọn thời gian';
    if (!this.endDate) return `${this.formatDisplayDate(this.startDate)} - ...`;
    return `${this.formatDisplayDate(this.startDate)} - ${this.formatDisplayDate(this.endDate)}`;
  }

  private formatDisplayDate(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
