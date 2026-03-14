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
import { SharedDropdownComponent } from '../../../components/shared-dropdown/shared-dropdown.component';
import { SharedDateTimePickerComponent } from '../../../components/shared-date-time/shared-date-time.component';
import { NOTIFICATION_TYPE_OPTIONS, NOTIFICATION_AUDIENCE_OPTIONS } from '../../../core/mocks/notification.mock';

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
    NzUploadModule,
    SharedDropdownComponent,
    SharedDateTimePickerComponent
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

  protected typeOptions = NOTIFICATION_TYPE_OPTIONS;
  protected audienceOptions = NOTIFICATION_AUDIENCE_OPTIONS;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      title: [{ value: this.initialData?.title || '', disabled: this.isReadOnly }, [Validators.required, Validators.maxLength(255)]],
      content: [{ value: this.initialData?.content || '', disabled: this.isReadOnly }, [Validators.required]],
      audience: [{ value: this.initialData?.audience || 'All', disabled: this.isReadOnly }, [Validators.required]],
      type: [{ value: this.initialData?.type || 'System', disabled: this.isReadOnly }, [Validators.required]],
      onclickAction: [{ value: this.initialData?.onclickAction || '', disabled: this.isReadOnly }],
      scheduleTime: [{ value: this.initialData?.scheduleTime ? new Date(this.initialData.scheduleTime) : null, disabled: this.isReadOnly }],
    });
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      const formValue = this.validateForm.value;
      const result: Partial<NotificationRecord> = {
        ...formValue,
        scheduleTime: formValue.scheduleTime ? formValue.scheduleTime.toISOString() : undefined
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
