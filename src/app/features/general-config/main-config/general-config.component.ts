import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { GeneralInfoComponent } from '../general-info/general-info.component';
import { SystemFormatComponent } from '../system-format/system-format.component';
import { TimeConfigComponent } from '../time-config/time-config.component';

@Component({
  selector: 'app-general-config',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzBreadCrumbModule,
    NzButtonModule,
    NzIconModule,
    GeneralInfoComponent,
    SystemFormatComponent,
    TimeConfigComponent,
  ],
  templateUrl: './general-config.component.html',
  styleUrl: './general-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralConfigComponent {
  protected readonly form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      appName: ['', []],
      language: [null as string | null, []],
      workingTime: [null as Date | null, []],
      shiftEndTime: [null as Date | null, []],
      autoCheckout: [null as Date | null, []],
    });
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      console.log('Apply config:', this.form.value);
      // TODO: Gọi API lưu cấu hình
    }
  }
}
