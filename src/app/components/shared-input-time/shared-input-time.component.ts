import { Component, ChangeDetectionStrategy, input, computed, signal, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, startWith, of } from 'rxjs';
import { DropdownOption } from '../shared-dropdown/shared-dropdown.component';

@Component({
    selector: 'app-shared-input-time',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './shared-input-time.component.html',
    styleUrls: ['./shared-input-time.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedInputTimeComponent {
    form = input.required<FormGroup>();
    controlName = input.required<string>();
    label = input<string>();
    placeholder = input<string>();
    required = input(false);

    private readonly elementRef = inject(ElementRef);

    protected readonly hours: DropdownOption[] = Array.from({ length: 24 }, (_, i) => {
        const value = String(i).padStart(2, '0');
        return { label: value, value };
    });

    protected readonly minutes: DropdownOption[] = Array.from({ length: 60 }, (_, i) => {
        const value = String(i).padStart(2, '0');
        return { label: value, value };
    });

    protected readonly control = computed(() => this.form().get(this.controlName()));
    protected readonly isOpen = signal(false);

    protected readonly value = toSignal(
        toObservable(computed(() => ({ form: this.form(), name: this.controlName() }))).pipe(
            switchMap(({ form, name }) => {
                const control = form.get(name);
                return control ? control.valueChanges.pipe(startWith(control.value)) : of(null);
            })
        )
    );

    protected readonly selectedHour = computed(() => this.getParts(this.value()).hour);
    protected readonly selectedMinute = computed(() => this.getParts(this.value()).minute);



    protected toggleOpen(event: Event): void {
        event.stopPropagation();
        this.isOpen.set(!this.isOpen());
    }

    protected close(): void {
        this.isOpen.set(false);
    }

    protected onHourChange(value: string): void {
        this.updateTime(value, this.selectedMinute());
    }

    protected onMinuteChange(value: string): void {
        this.updateTime(this.selectedHour(), value);
        this.close();
    }

    private updateTime(hour?: string | null, minute?: string | null): void {
        const control = this.control();
        if (!control) return;
        const safeHour = hour ?? '00';
        const safeMinute = minute ?? '00';
        control.setValue(`${safeHour}:${safeMinute}`);
        control.markAsDirty();
        control.markAsTouched();
    }

    private getParts(value: any): { hour: string | null; minute: string | null } {
        if (!value) return { hour: null, minute: null };
        const raw = String(value).trim();
        const parts = raw.split(':');
        if (parts.length >= 2) {
            return {
                hour: parts[0].padStart(2, '0'),
                minute: parts[1].padStart(2, '0'),
            };
        }
        return { hour: null, minute: null };
    }

    @HostListener('document:mousedown', ['$event'])
    onClickOutside(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.close();
        }
    }
}
