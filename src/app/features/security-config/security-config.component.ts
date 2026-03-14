import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { SecurityConfigService } from '../../services/security-config.service';
import { ToastService } from '../../services/toast.service';
import { PasswordPolicyComponent } from './password-policy/password-policy.component';
import { AccountSecurityComponent } from './account-security/account-security.component';
import { SessionSecurityComponent } from './session-security/session-security.component';
import { ConfirmPopup } from '../../components/popups/confirm-popup/confirm-popup';
import { NoDataComponent } from '../../components/no-data/no-data.component';
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
    NoDataComponent,
  ],
  templateUrl: './security-config.component.html',
  styleUrl: './security-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityConfigComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  protected readonly form: FormGroup;
  protected isConfirmVisible = false;

  protected readonly isLoading = signal(false);
  protected readonly isError = signal(false);

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
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Home', icon: 'custom-icon-home', url: '/main' },
      { label: 'Cấu Hình Hệ Thống' },
      { label: 'Bảo Mật', active: true }
    ]);
    this.fetchConfig();
  }

  private fetchConfig(): void {
    this.isLoading.set(true);
    this.isError.set(false);

    this.configService.getConfig().subscribe({
      next: (res) => {
        if (res.data) {
          this.form.patchValue(res.data);
          this.isError.set(false);
        } else {
          this.isError.set(true);
        }
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Fetch security config error:', err);
        this.isError.set(true);
        this.isLoading.set(false);
        this.cdr.markForCheck();
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
        this.toastService.successKey('toast.security.updateSuccess', 'toast.system');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Update security config error:', err);
        this.cdr.markForCheck();
      },
    });
  }

  protected handleConfirmCancel(): void {
    this.isConfirmVisible = false;
  }
}
