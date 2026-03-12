import { Component, ChangeDetectionStrategy, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs';

@Component({
  selector: 'app-general-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './general-info.component.html',
  styleUrl: './general-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralInfoComponent {
  form = input.required<FormGroup>();

  protected readonly logoUrl = toSignal(
    this.form().get('logoUrl')!.valueChanges.pipe(
      startWith(this.form().get('logoUrl')?.value),
    )
  );
  protected readonly logoFile = signal<{ name: string; url?: string } | null>(null);

  protected onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      this.logoFile.set({ name: file.name, url });
    }
    input.value = '';
  }

  protected removeLogo(): void {
    this.logoFile.set(null);
  }
}
