import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, startWith, of } from 'rxjs';

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

    protected readonly value = toSignal(
        toObservable(computed(() => ({ form: this.form(), name: this.controlName() }))).pipe(
            switchMap(({ form, name }) => {
                const control = form.get(name);
                return control ? control.valueChanges.pipe(startWith(control.value)) : of(null);
            })
        )
    );
}
