import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';

@Component({
    selector: 'app-time-config',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NzTimePickerModule,
    ],
    templateUrl: './time-config.component.html',
    styleUrl: './time-config.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeConfigComponent {
    @Input({ required: true }) form!: FormGroup;
}
