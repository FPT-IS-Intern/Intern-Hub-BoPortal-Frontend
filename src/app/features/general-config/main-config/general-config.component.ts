import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GeneralInfoComponent } from '../general-info/general-info.component';
import { SystemFormatComponent } from '../system-format/system-format.component';
import { TimeConfigComponent } from '../time-config/time-config.component';
import { GeneralConfigService } from '../../../services/general-config.service';
import { UploadService } from '../../../services/upload.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmPopup } from '../../../components/popups/confirm-popup/confirm-popup';
import { switchMap, of, Observable } from 'rxjs';

@Component({
  selector: 'app-general-config',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    GeneralInfoComponent,
    SystemFormatComponent,
    TimeConfigComponent,
    ConfirmPopup,
  ],
  templateUrl: './general-config.component.html',
  styleUrl: './general-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralConfigComponent implements OnInit {
  protected readonly form: FormGroup;
  protected isConfirmVisible = false;
  private selectedLogoFile: File | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly configService: GeneralConfigService,
    private readonly uploadService: UploadService,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      appName: ['', []],
      logoUrl: [null as string | null, []],
      defaultLanguage: [null as string | null, []],
      workStartTime: [null as string | null, []],
      workEndTime: [null as string | null, []],
      autoCheckoutTime: [null as string | null, []],
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
        console.error('Fetch config error:', err);
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

    let updateObs: Observable<any>;

    if (this.selectedLogoFile) {
      updateObs = this.uploadService.upload(this.selectedLogoFile).pipe(
        switchMap(res => {
          if (res.data) {
            this.form.patchValue({ logoUrl: res.data });
          }
          return this.configService.updateConfig(this.form.value);
        })
      );
    } else {
      updateObs = this.configService.updateConfig(this.form.value);
    }

    updateObs.subscribe({
      next: () => {
        this.toastService.success('Cập nhật cấu hình thành công', 'Hệ thống');
        this.selectedLogoFile = null;
        this.configService.getConfig().subscribe(); // Refresh cache
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Update config error:', err);
        this.toastService.error('Cập nhật cấu hình thất bại', 'Lỗi');
        this.cdr.markForCheck();
      },
    });
  }

  protected onLogoFileChange(file: File | null): void {
    this.selectedLogoFile = file;
  }

  protected handleConfirmCancel(): void {
    this.isConfirmVisible = false;
  }
}
