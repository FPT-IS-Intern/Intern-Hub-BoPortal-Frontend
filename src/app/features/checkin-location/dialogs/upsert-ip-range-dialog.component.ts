import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpContext } from '@angular/common/http';
import { IPRange } from '../../../models/checkin-config.model';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../services/toast.service';
import { catchError, concat, map, of, take, finalize, filter } from 'rxjs';
import { SKIP_API_ERROR_TOAST } from '../../../core/interceptors/api-error.interceptor';
import { ModalPopup } from '../../../components/popups/modal-popup/modal-popup';

@Component({
  selector: 'app-upsert-ip-range-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ModalPopup],
  templateUrl: './upsert-ip-range-dialog.component.html',
  styleUrls: ['./upsert-ip-range-dialog.component.scss']
})
export class UpsertIPRangeDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  @Input() isVisible = false;
  @Input() data: IPRange | null = null;
  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<any>();

  protected form = this.fb.group({
    id: [null as string | null],
    name: ['', [Validators.required]],
    ipPrefix: ['', [Validators.required]],
    description: [''],
    isActive: [true]
  });

  isFetchingIP = false;

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        id: this.data.id,
        name: this.data.name,
        ipPrefix: this.data.ipPrefix,
        description: this.data.description,
        isActive: this.data.isActive
      });
    } else {
      this.fetchCurrentIP();
    }
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
    if (this.form.valid) this.save.emit(this.form.value);
  }

  cancel(): void {
    this.isVisible = false;
    this.isVisibleChange.emit(this.isVisible);
  }
}
