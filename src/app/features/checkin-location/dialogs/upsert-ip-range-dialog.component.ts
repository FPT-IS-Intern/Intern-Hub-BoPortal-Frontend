import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
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
    NzButtonModule
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
          <input nz-input formControlName="ipPrefix" placeholder="000.000.000.000" />
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
  readonly data = inject<IPRange>(NZ_MODAL_DATA, { optional: true });

  protected form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [this.data?.id || null],
      name: [this.data?.name || '', [Validators.required]],
      ipPrefix: [this.data?.ipPrefix || '', [Validators.required]],
      description: [this.data?.description || ''],
      isActive: [this.data ? this.data.isActive : true]
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
