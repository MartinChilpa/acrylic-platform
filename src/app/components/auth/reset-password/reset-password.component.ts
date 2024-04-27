import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../../services/account.service';
import { AlertService } from '../../../services/alert.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { PasswordValidatorDirective } from '../../../directives/password-validator.directive';
import { ICommonResponse } from '../../../interfaces/response/common.response';
import { NavigationService } from '../../../services/navigation.service';

@Component({
  selector: 'acrylic-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgOptimizedImage,
    PasswordValidatorDirective,
    NgClass
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  showPassword = false;
  resetPasswordForm!: FormGroup;

  private _fb = inject(FormBuilder);
  private _accountService = inject(AccountService);
  private _alertService = inject(AlertService);
  private _route = inject(ActivatedRoute);
  public _navigationService = inject(NavigationService);

  ngOnInit(): void {
    this.InitResetForm();
    this.FillRouteParams();
  }

  InitResetForm(): void {
    this.resetPasswordForm = this._fb.group({
      user_id: [''],
      timestamp: [0],
      signature: [''],
      password: ['', [Validators.required]]
    });
  }

  FillRouteParams(): void {
    this._route.queryParams
      .subscribe((params) => {
        this.resetPasswordForm.patchValue({
          user_id: params['user_id'] ?? '',
          timestamp: params['timestamp'] ?? 0,
          signature: params['signature'] ?? ''
        });
      });
  }

  resetPassword(): void {
    if (this.resetPasswordForm.invalid)
      return;

    this._accountService.resetPassword(this.resetPasswordForm.value)
      .subscribe({
        next: (response: ICommonResponse) => {
          if (response && response.detail) {
            this._alertService.success(response.detail);
          } else {
            this._alertService.success("Password reset successfully"); // Default success message
          }
          this._navigationService.navigateToSignIn();
        }
      });
  }
}
