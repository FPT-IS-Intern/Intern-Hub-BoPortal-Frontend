import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ERROR_CODE_MAP } from './error-code.map';

@Injectable({
  providedIn: 'root',
})
export class ErrorMessageService {
  constructor(private readonly translate: TranslateService) {}

  resolve(code?: string): string {
    const key = (code && ERROR_CODE_MAP[code]) || 'error.system';
    return this.translate.instant(key);
  }
}
