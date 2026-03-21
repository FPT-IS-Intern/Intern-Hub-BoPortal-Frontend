import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../services/common/loading.service';

let activeRequests = 0;
type LoadingMode = 'page' | 'global' | 'skip';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  const loadingMode = (req.headers.get('X-Loading-Mode') as LoadingMode | null)
    ?? (req.headers.has('X-Skip-Loading') ? 'skip' : null);

  if (loadingMode === 'skip') {
    return next(req);
  }

  const resolvedMode: Exclude<LoadingMode, 'skip'> = loadingMode
    ?? (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) ? 'global' : 'page');
  
  activeRequests++;
  
  if (activeRequests === 1) {
    if (resolvedMode === 'global') {
      loadingService.showGlobalLoading();
    } else {
      loadingService.showPageLoading();
    }
  }

  return next(req).pipe(
    finalize(() => {
      activeRequests--;
      if (activeRequests === 0) {
        loadingService.hideGlobalLoading();
        loadingService.hidePageLoading();
      }
    })
  );
};
