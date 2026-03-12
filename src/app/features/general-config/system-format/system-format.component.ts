import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
    selector: 'app-system-format',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
    ],
    templateUrl: './system-format.component.html',
    styleUrl: './system-format.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemFormatComponent {
    form = input.required<FormGroup>();

    protected readonly languageOptions = [
        { label: 'Tiếng Việt', value: 'vi-VN' },
        { label: 'English', value: 'en-US' },
    ];
}
