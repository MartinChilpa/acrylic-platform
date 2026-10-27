import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';

/**
 * Set on requests whose failure the caller handles quietly (optional data),
 * so no global error alert is shown for them.
 */
export const SKIP_ERROR_ALERT = new HttpContextToken<boolean>(() => false);

/**
 * A stale or rejected session token: SimpleJWT's `token_not_valid`, or a
 * failed refresh. Not something the user can act on from an alert.
 */
function isInvalidSessionError(url: string, error: HttpErrorResponse): boolean {
  return error.status === 401
    && (error.error?.code === 'token_not_valid' || url.includes('/auth/token/refresh'));
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const alertService = inject(AlertService);
  const authService = inject(AuthService);
  return next(req).pipe(catchError((error: HttpErrorResponse) => {
    if (req.context.get(SKIP_ERROR_ALERT)) {
      return throwError(() => error);
    }
    if (isInvalidSessionError(req.url, error)) {
      // No alert: the session is cleared and protected pages go to sign-in.
      // A failed refresh is already handled by AuthService.check().
      if (!req.url.includes('/auth/token/refresh')) {
        authService.handleInvalidToken();
      }
      return throwError(() => error);
    }
    let errorTitle = "";
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`; // Client-side error
    }
    else if(error.error?.detail){
      errorMessage = `${error.error.detail}`;
    }
    else if(error.error?.email){
      errorMessage = `${error.error?.email}`;
    }
    else {
      switch (error.status) { // Server-side error
        case 400:
          errorTitle = "Bad Request";
          errorMessage = 'Please check your input.';
          break;
        case 401:
          errorTitle = "Unauthorized";
          errorMessage = 'You must log in to continue.';
          break;
        case 403:
          errorTitle = "Forbidden";
          errorMessage = 'You do not have permission to access this resource.';
          break;
        case 404:
          errorTitle = "Not Found";
          errorMessage = 'Please try again later.';
          break;
        case 409:
          errorTitle = "Conflict";
          errorMessage = 'The request could not be completed due to a conflict with the current state of the resource.';
          break;
        case 500:
          errorTitle = "Internal server error"
          errorMessage = 'Please try again later.';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
          break;
      }
    }
    if (!alertService.ignoreAlert()) {
      alertService.error(errorMessage, errorTitle); // Show error alert
    }
    return throwError(() => errorMessage);
  }))
};

