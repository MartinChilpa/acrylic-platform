import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { AuthUtils } from '../utils/auth.utils';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const _authService = inject(AuthService);
  let reqClone = req.clone();
  if (_authService.accessToken && !AuthUtils.isTokenExpired(_authService.accessToken)) {
      reqClone = req.clone({
          headers: req.headers.set('Authorization', 'Bearer ' + _authService.accessToken)
      });
  }
  return next(reqClone);
};
