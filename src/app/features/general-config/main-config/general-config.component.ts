import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbService } from '../../../services/common/breadcrumb.service';
import { GeneralInfoComponent } from '../general-info/general-info.component';
import { SystemFormatComponent } from '../system-format/system-format.component';
import { TimeConfigComponent } from '../time-config/time-config.component';
import { GeneralConfigService } from '../../../services/api/general-config.service';
import { UploadService } from '../../../services/api/upload.service';
import { ToastService } from '../../../services/common/toast.service';
import { ConfirmPopup } from '../../../components/popups/confirm-popup/confirm-popup';
import { NoDataComponent } from '../../../components/no-data/no-data.component';
import { BreadcrumbItem } from '../../../components/breadcrumb/breadcrumb.component';
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
    NoDataComponent,
  ],
  templateUrl: './general-config.component.html',
  styleUrl: './general-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralConfigComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  protected readonly form: FormGroup;
  protected isConfirmVisible = false;
  private selectedLogoFile: File | null = null;
  
  
  protected readonly isError = signal(false);

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
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Home', icon: 'custom-icon-home', url: '/main' },
      { label: 'Cấu Hình Hệ Thống' },
      { label: 'Cấu Hình Chung', active: true }
    ]);
    this.fetchConfig();
  }

  private fetchConfig(): void {
    
    this.isError.set(false);
    
    this.configService.getConfig().subscribe({
      next: (res) => {
        if (res.data) {
          this.form.patchValue(res.data);
          this.isError.set(false);
        } else {
          this.isError.set(true);
        }
        
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Fetch config error:', err);
        this.isError.set(true);
        
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

    let updateObs: Observable<any>;

    if (this.selectedLogoFile) {
      updateObs = this.uploadService.upload(this.selectedLogoFile).pipe(
        switchMap((res: any) => {
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
        this.toastService.successKey('toast.config.updateSuccess', 'toast.system');
        this.selectedLogoFile = null;
        this.configService.getConfig().subscribe(); // Refresh cache
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Update config error:', err);
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
