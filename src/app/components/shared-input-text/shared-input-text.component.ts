import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-shared-input-text',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './shared-input-text.component.html',
    styleUrls: ['./shared-input-text.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedInputTextComponent {
    @Input() headerInput = '';
    @Input() placeholder = '';
    @Input() typeInput: 'text' | 'password' | 'number' | 'url' = 'text';
    @Input() required = false;
    @Input() icon: string | null = null;
    @Input() value: string | number | null = '';

    @Output() valueChange = new EventEmitter<string>();
    @Output() iconClick = new EventEmitter<void>();

    onValueChange(newValue: string) {
        this.valueChange.emit(newValue);
    }

    onIconClick() {
        this.iconClick.emit();
    }
}
