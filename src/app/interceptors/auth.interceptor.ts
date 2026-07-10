import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { AuthUtils } from '../utils/auth.utils';
import { catchError, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const _authService = inject(AuthService);

  // Never intercept the token/refresh endpoints themselves (would cause infinite loop)
  if (req.url.includes('/auth/token')) {
    return next(req);
  }

  const token = _authService.accessToken;

  if (token && !AuthUtils.isTokenExpired(token)) {
    return next(req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + token)
    }));
  }

  // Token missing or expired — try to refresh before sending
  return _authService.check().pipe(
    switchMap(() => {
      const freshToken = _authService.accessToken;
      if (freshToken && !AuthUtils.isTokenExpired(freshToken)) {
        return next(req.clone({
          headers: req.headers.set('Authorization', 'Bearer ' + freshToken)
        }));
      }
      return next(req);
    }),
    catchError(() => next(req))
  );
};
