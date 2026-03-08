import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
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
    @Input({ required: true }) form!: FormGroup;

    protected readonly languageOptions = [
        { label: 'Tiếng Việt', value: 'vi' },
        { label: 'English', value: 'en' },
    ];
}
