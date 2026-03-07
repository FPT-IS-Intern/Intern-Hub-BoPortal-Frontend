import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-security-config',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzBreadCrumbModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
  ],
  templateUrl: './security-config.component.html',
  styleUrl: './security-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityConfigComponent {
  protected readonly form: FormGroup;

  protected readonly allowSpaceOptions = [
    { label: 'Có', value: true },
    { label: 'Không', value: false },
  ];

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      minLength: [8, []],
      maxLength: [1, []],
      uppercaseCount: [1, []],
      digitCount: [1, []],
      expirationDays: [90, []],
      specialCharCount: [8, []],
      autoLogoutMinutes: [3, []],
      maxLoginAttempts: [8, []],
      allowSpace: [false, []],
    });
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      console.log('Apply security config:', this.form.value);
      // TODO: Gọi API lưu cấu hình bảo mật
    }
  }
}
