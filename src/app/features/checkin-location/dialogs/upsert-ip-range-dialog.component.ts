import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { IPRange } from '../../../models/checkin-config.model';

@Component({
  selector: 'app-upsert-ip-range-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzIconModule
  ],
  templateUrl: './upsert-ip-range-dialog.component.html',
  styleUrls: ['./upsert-ip-range-dialog.component.scss']
})
export class UpsertIPRangeDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modalRef = inject(NzModalRef);
  private readonly http = inject(HttpClient);
  readonly data = inject<IPRange>(NZ_MODAL_DATA, { optional: true });

  protected form!: FormGroup;
  isFetchingIP = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [this.data?.id || null],
      name: [this.data?.name || '', [Validators.required]],
      ipPrefix: [this.data?.ipPrefix || '', [Validators.required]],
      description: [this.data?.description || ''],
      isActive: [this.data ? this.data.isActive : true]
    });

    // Auto-fetch IP if it's a new entry
    if (!this.data?.id) {
      this.fetchCurrentIP();
    }
  }

  fetchCurrentIP(): void {
    this.isFetchingIP = true;

    // Thử API thứ 1 (ipify)
    this.http.get<{ ip: string }>('https://api.ipify.org?format=json').subscribe({
      next: (res) => {
        if (res?.ip) this.form.patchValue({ ipPrefix: res.ip });
        this.isFetchingIP = false;
      },
      error: () => {
        // Nếu API 1 bị FPT chặn, Thử API thứ 2 (jsonip)
        this.http.get<{ ip: string }>('https://jsonip.com').subscribe({
          next: (res2) => {
            if (res2?.ip) this.form.patchValue({ ipPrefix: res2.ip });
            this.isFetchingIP = false;
          },
          error: () => {
            // Thử API thứ 3 (ipinfo)
            this.http.get<{ ip: string }>('https://ipinfo.io/json').subscribe({
              next: (res3) => {
                if (res3?.ip) this.form.patchValue({ ipPrefix: res3.ip });
                this.isFetchingIP = false;
              },
              error: (err) => {
                console.error('Tất cả API lấy IP đều bị mạng Cty chặn.', err);
                // Báo lỗi cho người dùng biết
                alert('Mạng công ty (Firewall) đang chặn các trang cấp IP. Bạn vui lòng nhập tay nhé!');
                this.isFetchingIP = false;
              }
            });
          }
        });
      }
    });
  }

  submit(): void {
    if (this.form.valid) {
      this.modalRef.close(this.form.value);
    }
  }

  cancel(): void {
    this.modalRef.destroy();
  }
}
