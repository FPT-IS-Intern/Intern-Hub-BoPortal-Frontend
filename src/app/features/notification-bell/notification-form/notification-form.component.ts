import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationRecord } from '@/models/notification.model';
import { SharedDropdownComponent } from '@/components/shared-dropdown/shared-dropdown.component';
import { SharedDateTimePickerComponent } from '@/components/shared-date-time/shared-date-time.component';
import { NOTIFICATION_AUDIENCE_OPTIONS, NOTIFICATION_TYPE_OPTIONS } from '@/core/constants/notification.constants';

interface NotificationFormValue {
  title: string;
  content: string;
  audience: NotificationRecord['audience'];
  type: NotificationRecord['type'];
  onclickAction: string;
  scheduleTime: Date | null;
}

type NotificationFormGroup = FormGroup<{
  title: FormControl<string>;
  content: FormControl<string>;
  audience: FormControl<NotificationRecord['audience']>;
  type: FormControl<NotificationRecord['type']>;
  onclickAction: FormControl<string>;
  scheduleTime: FormControl<Date | null>;
}>;

@Component({
  selector: 'app-notification-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedDropdownComponent,
    SharedDateTimePickerComponent,
    TranslateModule
  ],
  templateUrl: './notification-form.component.html',
  styleUrl: './notification-form.component.scss'
})
export class NotificationFormComponent implements OnInit {
  @Input() initialData: NotificationRecord | null = null;
  @Input() isReadOnly = false;
  @Output() save = new EventEmitter<Partial<NotificationRecord>>();
  @Output() cancel = new EventEmitter<void>();

  validateForm!: NotificationFormGroup;

  protected typeOptions = NOTIFICATION_TYPE_OPTIONS;
  protected audienceOptions = NOTIFICATION_AUDIENCE_OPTIONS;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      title: this.fb.nonNullable.control(
        { value: this.initialData?.title || '', disabled: this.isReadOnly },
        [Validators.required, Validators.maxLength(255)],
      ),
      content: this.fb.nonNullable.control(
        { value: this.initialData?.content || '', disabled: this.isReadOnly },
        [Validators.required],
      ),
      audience: this.fb.nonNullable.control(
        { value: this.initialData?.audience || 'All', disabled: this.isReadOnly },
        [Validators.required],
      ),
      type: this.fb.nonNullable.control(
        { value: this.initialData?.type || 'System', disabled: this.isReadOnly },
        [Validators.required],
      ),
      onclickAction: this.fb.nonNullable.control({
        value: this.initialData?.onclickAction || '',
        disabled: this.isReadOnly,
      }),
      scheduleTime: this.fb.control<Date | null>(
        {
          value: this.initialData?.scheduleTime ? new Date(this.initialData.scheduleTime) : null,
          disabled: this.isReadOnly,
        },
        [this.futureDateValidator],
      ),
    }) as NotificationFormGroup;
  }

  private readonly futureDateValidator: ValidatorFn = (
    control: AbstractControl<Date | string | null>,
  ): ValidationErrors | null => {
    if (!control.value) return null;
    const now = new Date();
    const selected = new Date(control.value);
    return selected > now ? null : { pastDate: true };
  };

  submitForm(): void {
    if (this.validateForm.valid) {
      const formValue = this.validateForm.getRawValue() as NotificationFormValue;
      const result: Partial<NotificationRecord> = {
        ...formValue,
        scheduleTime: formValue.scheduleTime ? formValue.scheduleTime.toISOString() : undefined
      };
      this.save.emit(result);
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}


