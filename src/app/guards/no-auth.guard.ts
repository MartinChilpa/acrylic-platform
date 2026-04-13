import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NavigationService } from '../services/navigation.service';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const _navigationService = inject(NavigationService);
  const _authService = inject(AuthService);
  return _authService.check()
    .pipe(
      switchMap((authenticated) => {
        // If the user is not authenticated...
          if (authenticated) {

          // Redirect to the home page
          if (_authService.isLabelUserType()) {
            _navigationService.navigateToLabelHome();
          } else if (_authService.isArtistUserType()) {
            _navigationService.navigateToHome();
          } else {
            _navigationService.navigateToAcquierDashboard();
          }

          // Prevent the access
          return of(false);
        }

        // Allow the access
        return of(true);
      })
    );
};
