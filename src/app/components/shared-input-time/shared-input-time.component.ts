import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
    selector: 'app-shared-input-time',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './shared-input-time.component.html',
    styleUrls: ['./shared-input-time.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedInputTimeComponent {
    @Input({ required: true }) form!: FormGroup;
    @Input({ required: true }) controlName!: string;
    @Input() label?: string;
    @Input() placeholder?: string;
    @Input() required = false;
}
