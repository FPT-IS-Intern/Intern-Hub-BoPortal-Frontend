import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NoDataComponent } from '../../components/no-data/no-data.component';
import { SharedInputTextComponent } from '../../components/shared-input-text/shared-input-text.component';
import { SharedInputTimeComponent } from '../../components/shared-input-time/shared-input-time.component';
import { SharedDropdownComponent } from '../../components/shared-dropdown/shared-dropdown.component';
import { BreadcrumbService } from '../../services/common/breadcrumb.service';
import { LoadingService } from '../../services/common/loading.service';
import { ToastService } from '../../services/common/toast.service';
import { SystemConfigurationService } from '../../services/api/system-configuration.service';
import { SystemConfigUpdateRequest, SecurityConfigUpdateRequest } from '../../models/system-configuration.model';
import { AuthService } from '../../services/api/auth.service';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    NoDataComponent,
    SharedInputTextComponent,
    SharedInputTimeComponent,
    SharedDropdownComponent,
  ],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemSettingsComponent implements OnInit {
  private readonly systemService = inject(SystemConfigurationService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly loadingService = inject(LoadingService);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  protected readonly isInitLoading = signal(false);
  protected readonly isError = signal(false);
  protected readonly isSaving = signal(false);

  protected languageOptions: { label: string; value: string }[] = [];
  protected allowWhitespaceOptions: { label: string; value: boolean }[] = [];

  protected readonly systemForm = this.fb.group({
    appName: ['', [Validators.required]],
    logoUrl: [''],
    defaultLanguage: ['vi', [Validators.required]],
    workStartTime: ['', [Validators.required]],
    workEndTime: ['', [Validators.required]],
    autoCheckoutTime: ['', [Validators.required]],
  });

  protected readonly securityForm = this.fb.group(
    {
      minPasswordLength: [8, [Validators.required, Validators.min(1)]],
      maxPasswordLength: [32, [Validators.required, Validators.min(1)]],
      minUppercaseChars: [1, [Validators.required, Validators.min(0)]],
      minSpecialChars: [1, [Validators.required, Validators.min(0)]],
      minNumericChars: [1, [Validators.required, Validators.min(0)]],
      passwordExpiryDays: [90, [Validators.required, Validators.min(1)]],
      allowWhitespace: [false, [Validators.required]],
      autoLogoutMinutes: [30, [Validators.required, Validators.min(1)]],
      maxLoginAttempts: [5, [Validators.required, Validators.min(1)]],
    },
    { validators: [SystemSettingsComponent.passwordLengthValidator] }
  );

  ngOnInit(): void {
    this.updateBreadcrumbs(this.translate.instant('systemSettings.breadcrumb.title'));
    this.translate
      .stream('systemSettings.breadcrumb.title')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((title) => this.updateBreadcrumbs(title));

    this.refreshOptionLabels();
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshOptionLabels();
      this.cdr.markForCheck();
    });

    this.fetchConfigurations();
  }

  protected fetchConfigurations(): void {
    this.isError.set(false);
    this.isInitLoading.set(true);
    this.loadingService.show();

    this.systemService
      .getSystemConfiguration()
      .pipe(
        finalize(() => {
          this.isInitLoading.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          if (!res.data) {
            this.isError.set(true);
            return;
          }
          if (res.data.systemConfig) {
            this.patchSystemConfig(res.data.systemConfig);
          }
          if (res.data.securityConfig) {
            this.patchSecurityConfig(res.data.securityConfig);
          }
        },
        error: (err) => {
          console.error('Load system configuration error:', err);
          this.isError.set(true);
        },
      });
  }

  protected saveAll(): void {
    if (this.systemForm.invalid || this.securityForm.invalid) {
      this.systemForm.markAllAsTouched();
      this.securityForm.markAllAsTouched();
      return;
    }

    const systemRaw = this.systemForm.getRawValue();
    const securityRaw = this.securityForm.getRawValue();

    const systemPayload: SystemConfigUpdateRequest = {
      appName: (systemRaw.appName || '').trim(),
      logoUrl: systemRaw.logoUrl?.trim() || null,
      defaultLanguage: systemRaw.defaultLanguage || 'vi',
      workStartTime: this.toApiTime(systemRaw.workStartTime),
      workEndTime: this.toApiTime(systemRaw.workEndTime),
      autoCheckoutTime: this.toApiTime(systemRaw.autoCheckoutTime),
    };

    const securityPayload: SecurityConfigUpdateRequest = {
      minPasswordLength: this.toNumber(securityRaw.minPasswordLength),
      maxPasswordLength: this.toNumber(securityRaw.maxPasswordLength),
      minUppercaseChars: this.toNumber(securityRaw.minUppercaseChars),
      minSpecialChars: this.toNumber(securityRaw.minSpecialChars),
      minNumericChars: this.toNumber(securityRaw.minNumericChars),
      passwordExpiryDays: this.toNumber(securityRaw.passwordExpiryDays),
      allowWhitespace: !!securityRaw.allowWhitespace,
      autoLogoutMinutes: this.toNumber(securityRaw.autoLogoutMinutes),
      maxLoginAttempts: this.toNumber(securityRaw.maxLoginAttempts),
    };

    const userId = this.authService.userProfile()?.id || null;
    if (userId) {
      systemPayload.updatedBy = userId;
      securityPayload.updatedBy = userId;
    }

    this.isSaving.set(true);
    this.systemService
      .updateSystemConfig(systemPayload)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.patchSystemConfig(res.data);
          }
          this.systemService
            .updateSecurityConfig(securityPayload)
            .pipe(
              finalize(() => {
                this.isSaving.set(false);
                this.cdr.markForCheck();
              })
            )
            .subscribe({
              next: (secRes) => {
                if (secRes.data) {
                  this.patchSecurityConfig(secRes.data);
                }
                this.toastService.successKey('toast.config.updateSuccess', 'toast.system');
              },
              error: () => {
                this.toastService.errorKey('toast.security.updateError', 'toast.system');
              },
            });
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.errorKey('toast.config.updateError', 'toast.system');
          this.cdr.markForCheck();
        },
      });
  }

  protected canSave(): boolean {
    const hasChanges = this.systemForm.dirty || this.securityForm.dirty;
    return !this.isSaving() && hasChanges && this.systemForm.valid && this.securityForm.valid;
  }

  protected updateControl(form: any, controlName: string, value: any): void {
    const control = form.get(controlName);
    if (!control) return;
    control.setValue(value);
    control.markAsDirty();
    control.markAsTouched();
  }

  private patchSystemConfig(config: any): void {
    this.systemForm.patchValue(
      {
        appName: config.appName ?? '',
        logoUrl: config.logoUrl ?? '',
        defaultLanguage: config.defaultLanguage ?? 'vi',
        workStartTime: this.toInputTime(config.workStartTime),
        workEndTime: this.toInputTime(config.workEndTime),
        autoCheckoutTime: this.toInputTime(config.autoCheckoutTime),
      },
      { emitEvent: false }
    );
    this.systemForm.markAsPristine();
  }

  private patchSecurityConfig(config: any): void {
    this.securityForm.patchValue(
      {
        minPasswordLength: config.minPasswordLength ?? 0,
        maxPasswordLength: config.maxPasswordLength ?? 0,
        minUppercaseChars: config.minUppercaseChars ?? 0,
        minSpecialChars: config.minSpecialChars ?? 0,
        minNumericChars: config.minNumericChars ?? 0,
        passwordExpiryDays: config.passwordExpiryDays ?? 0,
        allowWhitespace: !!config.allowWhitespace,
        autoLogoutMinutes: config.autoLogoutMinutes ?? 0,
        maxLoginAttempts: config.maxLoginAttempts ?? 0,
      },
      { emitEvent: false }
    );
    this.securityForm.markAsPristine();
  }

  private refreshOptionLabels(): void {
    this.languageOptions = [
      { label: this.translate.instant('language.vi'), value: 'vi' },
      { label: this.translate.instant('language.en'), value: 'en' },
    ];
    this.allowWhitespaceOptions = [
      { label: this.translate.instant('systemSettings.options.allow'), value: true },
      { label: this.translate.instant('systemSettings.options.disallow'), value: false },
    ];
  }

  private updateBreadcrumbs(title: string): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('checkin.breadcrumb.home'), icon: 'custom-icon-home', url: '/main' },
      { label: title, active: true },
    ]);
  }

  private toInputTime(value?: string | null): string {
    if (!value) return '';
    const parts = String(value).split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return value;
  }

  private toApiTime(value?: string | null): string {
    if (!value) return '';
    const normalized = String(value).trim();
    return normalized.length === 5 ? `${normalized}:00` : normalized;
  }

  private toNumber(value: any): number {
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
  }

  private static passwordLengthValidator(control: AbstractControl): ValidationErrors | null {
    const min = Number(control.get('minPasswordLength')?.value);
    const max = Number(control.get('maxPasswordLength')?.value);
    if (Number.isNaN(min) || Number.isNaN(max)) return null;
    return min > max ? { passwordRange: true } : null;
  }
}
