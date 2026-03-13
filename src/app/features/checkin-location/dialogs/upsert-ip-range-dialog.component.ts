import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { IPRange } from '../../../models/checkin-config.model';

@Component({
  selector: 'app-upsert-ip-range-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSwitchModule,
    NzButtonModule,
    NzIconModule
  ],
  template: `
    <form nz-form [formGroup]="form" nzLayout="vertical">
      <nz-form-item>
        <nz-form-label nzRequired>Tên dải IP</nz-form-label>
        <nz-form-control nzErrorTip="Vui lòng nhập tên gợi nhớ">
          <input nz-input formControlName="name" placeholder="Ví dụ: WiFi Tầng 4" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label nzRequired>Dải IP Prefix (Cổng chào/Gateway)</nz-form-label>
        <nz-form-control nzErrorTip="Vui lòng nhập dải IP (Ví dụ: 118.69.125.122)">
          <nz-input-group [nzAddOnAfter]="autoFillTpl">
            <input nz-input formControlName="ipPrefix" placeholder="000.000.000.000" />
          </nz-input-group>
          <ng-template #autoFillTpl>
            <button nz-button nzType="text" type="button" (click)="fetchCurrentIP()" [nzLoading]="isFetchingIP" nzTooltipTitle="Lấy IP hiện tại của bạn">
              <span nz-icon nzType="aim" nzTheme="outline"></span> IP của tôi
            </button>
          </ng-template>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label>Mô tả</nz-form-label>
        <nz-form-control>
          <textarea nz-input formControlName="description" rows="3" placeholder="Thông tin thêm về dải IP này..."></textarea>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label>Trạng thái hoạt động</nz-form-label>
        <nz-form-control>
          <nz-switch formControlName="isActive"></nz-switch>
          <span style="margin-left: 8px;">{{ form.get('isActive')?.value ? 'Đang bật' : 'Đang tắt' }}</span>
        </nz-form-control>
      </nz-form-item>

      <div class="modal-footer" style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 8px;">
        <button nz-button nzType="default" (click)="cancel()">Hủy</button>
        <button nz-button nzType="primary" [disabled]="form.invalid" (click)="submit()">Lưu lại</button>
      </div>
    </form>
  `
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
