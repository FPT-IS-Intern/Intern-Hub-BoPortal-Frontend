import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
    selector: 'app-config-card',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, NzInputModule, NzSelectModule],
    templateUrl: './config-card.component.html',
    styleUrl: './config-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigCardComponent {
    @Input({ required: true }) title!: string;
    @Input({ required: true }) form!: FormGroup;
    @Input({ required: true }) controlName!: string;
    @Input() type: 'number' | 'select' = 'number';
    @Input() unit?: string;
    @Input() options: { label: string; value: any }[] = [];
}
