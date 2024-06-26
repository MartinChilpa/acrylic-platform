import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PasswordValidatorDirective } from '../../../directives/password-validator.directive';
import { NgClass } from '@angular/common';
import { AlertService } from '../../../services/alert.service';
import { AccountService } from '../../../services/account.service';
import { SocialLoginButtonComponent } from '../social-login-button/social-login-button.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'acrylic-sign-up',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PasswordValidatorDirective,
    NgClass,
    SocialLoginButtonComponent
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {

  showPassword = false;
  showConfirmPassword = false;
  signUpForm!: FormGroup;

  private _fb = inject(FormBuilder);
  private _accountService = inject(AccountService);
  private _alertService = inject(AlertService);
  private _activatedRoute = inject(ActivatedRoute);
  public _navigationService = inject(NavigationService);

  ngOnInit(): void {
    const emailFromQueryParams = this._activatedRoute.snapshot.queryParamMap.get('email') || '';
    this.signUpForm = this._fb.group({
      first_name: ['', Validators.required],
      last_name: [''],
      email: [emailFromQueryParams, [Validators.required, Validators.email]],
      password: ['', Validators.required],
      password_confirm: ['', Validators.required],
      profile: [''],
      spotify_url: [''],
      type: ['artist']
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const passwordControl = formGroup.get('password');
    const confirmPasswordControl = formGroup.get('password_confirm');

    if (passwordControl?.value === confirmPasswordControl?.value) {
      confirmPasswordControl?.setErrors(null);
    } else {
      confirmPasswordControl?.setErrors({ mismatch: true });
    }
  }

  signUp(): void {
    if (this.signUpForm.invalid)
      return;

    this.signUpForm.disable();

    this._accountService.registration(this.signUpForm.value)
      .subscribe({
        next: () => {
          this._alertService.success("Registration successfully");
          this._navigationService.navigateToSignDocuments();
        },
        error: () => {
          this.signUpForm.enable();
        }
      });
  }
}
