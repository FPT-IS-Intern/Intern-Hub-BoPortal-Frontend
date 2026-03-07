import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ConfigCardComponent } from '../../../components/config-card/config-card.component';

@Component({
    selector: 'app-password-policy',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ConfigCardComponent],
    templateUrl: './password-policy.component.html',
    styleUrl: './password-policy.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordPolicyComponent {
    @Input({ required: true }) form!: FormGroup;
}
