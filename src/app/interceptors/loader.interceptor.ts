import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoaderService } from '../services/loader.service';
import { finalize } from 'rxjs';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoaderService);

  if (!loadingService.getHideLoading()) {
    Promise.resolve().then(() => loadingService.setLoading(true));
  }

  return next(req).pipe(
    finalize(() => {
      Promise.resolve().then(() => loadingService.setLoading(false));
    }));
};
