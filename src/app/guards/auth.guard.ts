import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NavigationService } from '../services/navigation.service';

export const authGuard: CanActivateFn = (route, state) => {
  const _navigationService = inject(NavigationService);
  if (route.firstChild?.data?.['public']) {
    return of(true);
  }
  return inject(AuthService).check()
    .pipe(
      switchMap((authenticated) => {
        // If the user is not authenticated...
        if (!authenticated) {

          // Redirect to the sign in page
          _navigationService.navigateToSignIn();

          // Prevent the access
          return of(false);
        }

        // Allow the access
        return of(true);
      })
    );
};

// TODO: Need to Implement CanActivateChildFn