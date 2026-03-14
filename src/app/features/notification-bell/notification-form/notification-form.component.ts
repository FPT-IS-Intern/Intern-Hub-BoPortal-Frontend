import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NotificationRecord } from '../../../models/notification.model';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzUploadModule } from 'ng-zorro-antd/upload';

@Component({
  selector: 'app-notification-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzRadioModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSwitchModule,
    NzUploadModule
  ],
  templateUrl: './notification-form.component.html',
  styleUrl: './notification-form.component.scss'
})
export class NotificationFormComponent implements OnInit {
  @Input() initialData: NotificationRecord | null = null;
  @Input() isReadOnly = false;
  @Output() save = new EventEmitter<Partial<NotificationRecord>>();
  @Output() cancel = new EventEmitter<void>();

  validateForm!: FormGroup;
  isScheduled = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      title: [{ value: this.initialData?.title || '', disabled: this.isReadOnly }, [Validators.required, Validators.maxLength(255)]],
      content: [{ value: this.initialData?.content || '', disabled: this.isReadOnly }, [Validators.required]],
      audience: [{ value: this.initialData?.audience || 'All', disabled: this.isReadOnly }, [Validators.required]],
      type: [{ value: this.initialData?.type || 'System', disabled: this.isReadOnly }, [Validators.required]],
      onclickAction: [{ value: this.initialData?.onclickAction || '', disabled: this.isReadOnly }],
      scheduleTime: [{ value: this.initialData?.scheduleTime ? new Date(this.initialData.scheduleTime) : null, disabled: this.isReadOnly }],
    });

    if (this.initialData?.scheduleTime) {
      this.isScheduled = true;
    }
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      const formValue = this.validateForm.value;
      const result: Partial<NotificationRecord> = {
        ...formValue,
        scheduleTime: this.isScheduled && formValue.scheduleTime ? formValue.scheduleTime.toISOString() : undefined
      };
      this.save.emit(result);
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
