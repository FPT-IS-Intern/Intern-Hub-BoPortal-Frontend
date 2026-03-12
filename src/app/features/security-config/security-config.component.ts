import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SecurityConfigService } from '../../services/security-config.service';
import { ToastService } from '../../services/toast.service';
import { PasswordPolicyComponent } from './password-policy/password-policy.component';
import { AccountSecurityComponent } from './account-security/account-security.component';
import { SessionSecurityComponent } from './session-security/session-security.component';
import { ConfirmPopup } from '../../components/popups/confirm-popup/confirm-popup';
import { finalize } from 'rxjs';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-security-config',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    PasswordPolicyComponent,
    AccountSecurityComponent,
    SessionSecurityComponent,
    ConfirmPopup,
    BreadcrumbComponent,
  ],
  templateUrl: './security-config.component.html',
  styleUrl: './security-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityConfigComponent implements OnInit {
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', icon: 'custom-icon-home', url: '/main' },
    { label: 'Cấu Hình Hệ Thống' },
    { label: 'Bảo Mật', active: true }
  ];
  protected readonly form: FormGroup;
  protected isConfirmVisible = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly configService: SecurityConfigService,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      minPasswordLength: [8, []],
      maxPasswordLength: [16, []],
      minUppercaseChars: [1, []],
      minSpecialChars: [1, []],
      minNumericChars: [1, []],
      passwordExpiryDays: [90, []],
      allowWhitespace: [false, []],
      autoLogoutMinutes: [30, []],
      maxLoginAttempts: [5, []],
    });
  }

  ngOnInit(): void {
    this.fetchConfig();
  }

  private fetchConfig(): void {
    this.configService.getConfig().subscribe({
      next: (res) => {
        if (res.data) {
          this.form.patchValue(res.data);
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Fetch security config error:', err);
        this.toastService.error('Không thể tải cấu hình bảo mật');
      },
    });
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      this.isConfirmVisible = true;
    }
  }

  protected handleConfirmSave(): void {
    this.isConfirmVisible = false;
    this.cdr.markForCheck();

    this.configService.updateConfig(this.form.value).subscribe({
      next: () => {
        this.toastService.success('Cập nhật cấu hình bảo mật thành công');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Update security config error:', err);
        this.toastService.error('Cập nhật cấu hình bảo mật thất bại');
        this.cdr.markForCheck();
      },
    });
  }

  protected handleConfirmCancel(): void {
    this.isConfirmVisible = false;
  }
}
