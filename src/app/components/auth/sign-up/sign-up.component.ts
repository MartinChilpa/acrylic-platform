import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PasswordValidatorDirective } from '../../../directives/password-validator.directive';
import { NgClass } from '@angular/common';
import { AlertService } from '../../../services/alert.service';
import { AccountService } from '../../../services/account.service';

@Component({
  selector: 'acrylic-sign-up',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PasswordValidatorDirective,
    NgClass
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {

  showPassword = false;
  showConfirmPassword = false;
  signUpForm!: FormGroup;

  private _fb = inject(FormBuilder);
  public _navigationService = inject(NavigationService);
  public _accountService = inject(AccountService);
  public _alertService = inject(AlertService);

  ngOnInit(): void {
    this.signUpForm = this._fb.group({
      first_name: ['', Validators.required],
      last_name: [''],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      password_confirm: ['', Validators.required],
      profile: [''],
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
          this._navigationService.navigateToSignIn();
        },
        error: () => {
          this.signUpForm.enable();
        }
      });
  }
}
