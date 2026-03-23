import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

interface ConfigCardOption {
    label: string;
    value: string | number | boolean | null;
}

@Component({
    selector: 'app-config-card',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './config-card.component.html',
    styleUrl: './config-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigCardComponent {
    @Input({ required: true }) title!: string;
    @Input({ required: true }) form!: FormGroup;
    @Input({ required: true }) controlName!: string;
    @Input() type: 'number' | 'select' | 'text' | 'time' | 'url' = 'number';
    @Input() unit?: string;
    @Input() textAlign: 'left' | 'center' | 'right' = 'left';
    @Input() options: ConfigCardOption[] = [];
    @Input() placeholder?: string;
}
