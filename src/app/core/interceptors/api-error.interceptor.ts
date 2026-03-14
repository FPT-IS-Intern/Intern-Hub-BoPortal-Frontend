import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorMessageService } from '../../i18n/error-message.service';
import { ToastService } from '../../services/toast.service';

// When `true`, the interceptor will not emit a global error toast for that request.
// Use this for requests where the feature already shows a specific toast.
export const SKIP_API_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorMessageService = inject(ErrorMessageService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return throwError(() => error);
      }

      if (req.context.get(SKIP_API_ERROR_TOAST)) {
        return throwError(() => error);
      }

      const businessCode = error?.error?.status?.code as string | undefined;
      const resolvedCode = businessCode ?? fallbackCodeFromHttpStatus(error.status);
      const message = errorMessageService.resolve(resolvedCode);

      toast.error(message);
      return throwError(() => error);
    })
  );
};

function fallbackCodeFromHttpStatus(status: number): string | undefined {
  if (!status) {
    return undefined;
  }
  if (status >= 500) {
    return '0500';
  }
  if (status === 404) {
    return '0404';
  }
  if (status === 408) {
    return '0408';
  }
  if (status >= 400) {
    return '0400';
  }
  return undefined;
}
