import { AccountService } from './../../../services/account.service';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';
import { ICommonResponse } from '../../../interfaces/response/common.response';
import { NavigationService } from '../../../services/navigation.service';

@Component({
  selector: 'acrylic-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  forgotPasswordForm!: FormGroup;

  private _fb = inject(FormBuilder);
  private _accountService = inject(AccountService);
  private _alertService = inject(AlertService);
  public _navigationService = inject(NavigationService);

  ngOnInit(): void {
    this.forgotPasswordForm = this._fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  forgotPassword(): void {
    if (this.forgotPasswordForm.invalid)
      return;

    this._accountService.forgotPassword(this.forgotPasswordForm.value)
      .subscribe({
        next: (response: ICommonResponse) => {
          if (response && response.detail) {
            this._alertService.success(response.detail);
          } else {
            this._alertService.success("Password reset link sent"); // Default success message
          }
          this.forgotPasswordForm.reset();
        }
      });
  }
}
