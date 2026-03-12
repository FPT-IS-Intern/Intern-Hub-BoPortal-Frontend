import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { AttendanceLocation } from '../../../models/checkin-config.model';

@Component({
  selector: 'app-upsert-location-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    NzFormModule, 
    NzInputModule, 
    NzInputNumberModule,
    NzSwitchModule,
    NzButtonModule
  ],
  template: `
    <form nz-form [formGroup]="form" nzLayout="vertical">
      <nz-form-item>
        <nz-form-label nzRequired>Tên vị trí</nz-form-label>
        <nz-form-control nzErrorTip="Vui lòng nhập tên vị trí">
          <input nz-input formControlName="name" placeholder="Ví dụ: Văn phòng đại diện" />
        </nz-form-control>
      </nz-form-item>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <nz-form-item>
          <nz-form-label nzRequired>Vĩ độ (Latitude)</nz-form-label>
          <nz-form-control nzErrorTip="Vui lòng nhập vĩ độ">
            <nz-input-number formControlName="latitude" [nzMin]="-90" [nzMax]="90" style="width: 100%"></nz-input-number>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label nzRequired>Kinh độ (Longitude)</nz-form-label>
          <nz-form-control nzErrorTip="Vui lòng nhập kinh độ">
            <nz-input-number formControlName="longitude" [nzMin]="-180" [nzMax]="180" style="width: 100%"></nz-input-number>
          </nz-form-control>
        </nz-form-item>
      </div>

      <nz-form-item>
        <nz-form-label nzRequired>Bán kính cho phép (Meters)</nz-form-label>
        <nz-form-control nzErrorTip="Vui lòng nhập bán kính">
          <nz-input-number formControlName="radiusMeters" [nzMin]="1" style="width: 100%"></nz-input-number>
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
export class UpsertLocationDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modalRef = inject(NzModalRef);
  readonly data = inject<AttendanceLocation>(NZ_MODAL_DATA, { optional: true });

  protected form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [this.data?.id || null],
      name: [this.data?.name || '', [Validators.required]],
      latitude: [this.data?.latitude || null, [Validators.required]],
      longitude: [this.data?.longitude || null, [Validators.required]],
      radiusMeters: [this.data?.radiusMeters || 100, [Validators.required]],
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
