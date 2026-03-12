import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ConfigCardComponent } from '../../../components/config-card/config-card.component';

@Component({
    selector: 'app-session-security',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ConfigCardComponent],
    templateUrl: './session-security.component.html',
    styleUrl: './session-security.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionSecurityComponent {
    form = input.required<FormGroup>();
}
