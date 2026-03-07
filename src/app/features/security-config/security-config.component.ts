import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SecurityConfigService } from '../../services/security-config.service';

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
export class SecurityConfigComponent implements OnInit {
  protected readonly form: FormGroup;

  protected readonly allowSpaceOptions = [
    { label: 'Có', value: true },
    { label: 'Không', value: false },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly configService: SecurityConfigService,
    private readonly message: NzMessageService
  ) {
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

  ngOnInit(): void {
    this.fetchConfig();
  }

  private fetchConfig(): void {
    this.configService.getConfig().subscribe({
      next: (res) => {
        if (res.data) {
          this.form.patchValue(res.data);
        }
      },
      error: (err) => {
        console.error('Fetch security config error:', err);
        this.message.error('Không thể tải cấu hình bảo mật');
      },
    });
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      this.configService.updateConfig(this.form.value).subscribe({
        next: () => {
          this.message.success('Cập nhật cấu hình bảo mật thành công');
        },
        error: (err) => {
          console.error('Update security config error:', err);
          this.message.error('Cập nhật cấu hình bảo mật thất bại');
        },
      });
    }
  }
}
