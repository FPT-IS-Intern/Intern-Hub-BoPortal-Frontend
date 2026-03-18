import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-shared-input-text',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './shared-input-text.component.html',
    styleUrls: ['./shared-input-text.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedInputTextComponent implements AfterViewInit, OnChanges {
    @Input() headerInput = '';
    @Input() placeholder = '';
    @Input() typeInput: 'text' | 'password' | 'number' | 'url' = 'text';
    @Input() required = false;
    @Input() icon: string | null = null;
    @Input() value: string | number | null = '';

    @Output() valueChange = new EventEmitter<string>();
    @Output() iconClick = new EventEmitter<void>();

    @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;

    ngOnChanges(changes: SimpleChanges): void {
        if ('value' in changes) {
            this.applyValueToDom();
        }
    }

    ngAfterViewInit(): void {
        this.applyValueToDom();
        this.syncFromDom('afterViewInit');
        setTimeout(() => this.syncFromDom('afterViewInit+0'), 0);
        setTimeout(() => this.syncFromDom('afterViewInit+300'), 300);
    }

    @HostListener('window:pageshow')
    onPageShow(): void {
        this.syncFromDom('pageshow');
        setTimeout(() => this.syncFromDom('pageshow+300'), 300);
    }

    onValueChange(newValue: string) {
        this.valueChange.emit(newValue);
    }

    onAutofillStart(): void {
        this.syncFromDom('autofill');
    }

    onIconClick() {
        this.iconClick.emit();
    }

    private syncFromDom(source: string): void {
        const el = this.inputEl?.nativeElement;
        if (!el) return;
        const domValue = el.value ?? '';
        if (domValue !== (this.value ?? '')) {
            this.valueChange.emit(String(domValue));
        }
    }

    private applyValueToDom(): void {
        const el = this.inputEl?.nativeElement;
        if (!el) return;
        const nextValue = this.value ?? '';
        if (el.value !== String(nextValue)) {
            el.value = String(nextValue);
        }
    }
}
