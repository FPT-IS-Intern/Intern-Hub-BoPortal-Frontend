import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { GeneralInfoComponent } from '../general-info/general-info.component';
import { SystemFormatComponent } from '../system-format/system-format.component';
import { TimeConfigComponent } from '../time-config/time-config.component';
import { GeneralConfigService } from '../../../services/general-config.service';

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
export class GeneralConfigComponent implements OnInit {
  protected readonly form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly configService: GeneralConfigService,
    private readonly message: NzMessageService
  ) {
    this.form = this.fb.group({
      appName: ['', []],
      language: [null as string | null, []],
      workingTime: [null as Date | null, []],
      shiftEndTime: [null as Date | null, []],
      autoCheckout: [null as Date | null, []],
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
        console.error('Fetch config error:', err);
        this.message.error('Không thể tải cấu hình hệ thống');
      },
    });
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      this.configService.updateConfig(this.form.value).subscribe({
        next: () => {
          this.message.success('Cập nhật cấu hình thành công');
        },
        error: (err) => {
          console.error('Update config error:', err);
          this.message.error('Cập nhật cấu hình thất bại');
        },
      });
    }
  }
}
