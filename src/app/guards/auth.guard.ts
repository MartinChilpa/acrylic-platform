import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  return inject(AuthService).check()
    .pipe(
      switchMap((authenticated) => {

        // If the user is not authenticated...
        if (!authenticated) {

          // Redirect to the login page
          router.navigate(['auth/sign-in']);

          // Prevent the access
          return of(false);
        }

        // Allow the access
        return of(true);
      })
    );

  // return inject(AuthService).IsLoggedIn() ? true : inject(Router).createUrlTree(['/auth/sign-in']);
};

// TODO: Need to Implement CanActivateChildFn