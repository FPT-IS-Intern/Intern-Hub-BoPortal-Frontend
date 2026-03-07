import { Component, ChangeDetectionStrategy, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-general-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
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
