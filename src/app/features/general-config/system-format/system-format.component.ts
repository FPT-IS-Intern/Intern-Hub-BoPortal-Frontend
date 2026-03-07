import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
    selector: 'app-system-format',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NzSelectModule,
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
