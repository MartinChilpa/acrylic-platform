import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  private _router = inject(Router);

  navigateToHome() {
    this._router.navigate(['home']);
  }

  navigateToSignIn() {
    this._router.navigate(['auth/sign-in']);
  }

  navigateToSignUp() {
    this._router.navigate(['auth/sign-up']);
  }

  navigateToForgotPassword() {
    this._router.navigate(['auth/forgot-password']);
  }

  navigateToSyncList() {
    this._router.navigateByUrl('my-profile/add-synclist');
  }

  navigateToMyProfile() {
    this._router.navigateByUrl('/my-profile');
  }

  navigateToMyTracks() {
    this._router.navigateByUrl('/my-tracks');
  }
}
