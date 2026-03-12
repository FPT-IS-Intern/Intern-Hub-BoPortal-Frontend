import { Component, ChangeDetectionStrategy, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { startWith, map, switchMap, of } from 'rxjs';

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
  fileChange = output<File | null>();

  protected readonly logoUrl = toSignal(
    toObservable(this.form).pipe(
      switchMap(form => {
        const control = form.get('logoUrl');
        return control ? control.valueChanges.pipe(startWith(control.value)) : of(null);
      })
    )
  );
  protected readonly logoFile = signal<{ name: string; url?: string } | null>(null);

  protected onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      this.logoFile.set({ name: file.name, url });
      this.fileChange.emit(file);
    }
    input.value = '';
  }

  protected removeLogo(): void {
    this.logoFile.set(null);
    this.fileChange.emit(null);
  }
}
