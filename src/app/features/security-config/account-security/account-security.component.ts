import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ConfigCardComponent } from '../../../components/config-card/config-card.component';

@Component({
    selector: 'app-account-security',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ConfigCardComponent],
    templateUrl: './account-security.component.html',
    styleUrl: './account-security.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSecurityComponent {
    form = input.required<FormGroup>();

    protected readonly allowWhitespaceOptions = [
        { label: 'Có', value: true },
        { label: 'Không', value: false },
    ];
}
