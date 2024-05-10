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

  navigateToEditSyncList(id: string) {
    this._router.navigateByUrl(`/my-profile/edit-synclist/${id}`);
  }

  navigateToMyProfile() {
    this._router.navigateByUrl('/my-profile');
  }

  navigateToMyTracks() {
    this._router.navigateByUrl('/my-tracks');
  }

  navigateToEditTracks(id: string) {
    this._router.navigateByUrl(`/upload/${id}`);
  }

  navigateToMyFinance() {
    this._router.navigateByUrl(`/my-finances`);
  }

  navigateToMyRevenue() {
    this._router.navigateByUrl(`/my-finances/my-revenue`);
  }

  navigateToMyDocument() {
    this._router.navigateByUrl(`/my-finances/my-document`);
  }

  navigateToMySubscription() {
    this._router.navigateByUrl(`/my-finances/my-subscription`);
  }

  navigateToMyTransaction() {
    this._router.navigateByUrl(`/my-finances/my-transactions`);
  }

  navigateToPreviewSplitSheet(id: string) {
    this._router.navigateByUrl(`/my-split-sheets/review/${id}`);
  }

  navigateToMySplitSheet() {
    this._router.navigateByUrl(`/my-split-sheets`);
  }

  navigateToUploadTrack() {
    this._router.navigate(['upload']);
  }
}
