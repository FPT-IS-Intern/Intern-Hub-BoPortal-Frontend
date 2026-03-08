import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { SharedInputTimeComponent } from '../../../components/shared-input-time/shared-input-time.component';

@Component({
    selector: 'app-time-config',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        SharedInputTimeComponent,
    ],
    templateUrl: './time-config.component.html',
    styleUrl: './time-config.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeConfigComponent {
    @Input({ required: true }) form!: FormGroup;
}
