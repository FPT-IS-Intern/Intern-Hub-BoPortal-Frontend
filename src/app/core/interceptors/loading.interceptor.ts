import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../services/common/loading.service';

let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  if (req.headers.has('X-Skip-Loading')) {
    return next(req);
  }

  // Determine which loading type to show
  // GET requests use Top Progress Bar (page loading)
  // POST, PUT, DELETE, PATCH use Global Overlay (blocking loading)
  const isDataMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  
  activeRequests++;
  
  if (isDataMutation) {
    loadingService.showGlobalLoading();
  } else {
    loadingService.showPageLoading();
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
