import { Component, ChangeDetectionStrategy, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

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
  @Input({ required: true }) form!: FormGroup;

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
