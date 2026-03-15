import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpContext } from '@angular/common/http';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { IPRange } from '../../../models/checkin-config.model';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../services/toast.service';
import { catchError, concat, map, of, take, finalize, filter } from 'rxjs';
import { SKIP_API_ERROR_TOAST } from '../../../core/interceptors/api-error.interceptor';

@Component({
  selector: 'app-upsert-ip-range-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './upsert-ip-range-dialog.component.html',
  styleUrls: ['./upsert-ip-range-dialog.component.scss']
})
export class UpsertIPRangeDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modalRef = inject(NzModalRef);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  readonly data = inject<IPRange>(NZ_MODAL_DATA, { optional: true });

  protected form = this.fb.group({
    id: [this.data?.id || null],
    name: [this.data?.name || '', [Validators.required]],
    ipPrefix: [this.data?.ipPrefix || '', [Validators.required]],
    description: [this.data?.description || ''],
    isActive: [this.data ? this.data.isActive : true]
  });

  isFetchingIP = false;

  ngOnInit(): void {
    if (!this.data?.id) this.fetchCurrentIP();
  }

  fetchCurrentIP(): void {
    const apis = [
      { url: 'https://api.ipify.org?format=json', type: 'json' },
      { url: 'https://jsonip.com', type: 'json' },
      { url: 'https://api.ipify.org', type: 'text' }
    ];

    this.isFetchingIP = true;

    concat(...apis.map(api => {
      const options = {
        context: new HttpContext().set(SKIP_API_ERROR_TOAST, true),
        responseType: (api.type === 'text' ? 'text' : 'json') as 'json'
      };

      return this.http.get<any>(api.url, options).pipe(
        map(res => api.type === 'json' ? res?.ip : res?.trim()),
        catchError(() => of(null))
      );
    })).pipe(
      filter(ip => !!ip),
      take(1),
      finalize(() => this.isFetchingIP = false)
    ).subscribe({
      next: (ip) => this.form.patchValue({ ipPrefix: ip }),
      complete: () => {
        if (!this.form.get('ipPrefix')?.value) {
          this.toast.warningKey('checkin.ipDialog.alerts.ipBlocked');
        }
      }
    });
  }

  submit(): void {
    if (this.form.valid) this.modalRef.close(this.form.value);
  }

  cancel(): void {
    this.modalRef.destroy();
  }
}
