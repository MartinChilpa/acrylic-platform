import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import { PasswordValidatorDirective } from '../../../directives/password-validator.directive';
import { NgClass } from '@angular/common';

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
  private _authService = inject(AuthService);
  private _alertService = inject(AlertService);
  public _navigationService = inject(NavigationService);

  ngOnInit(): void {
    this.signUpForm = this._fb.group({
      first_name: ['', Validators.required],
      last_name: [''],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      password_confirm: ['', Validators.required],
      profile: [''],
    });
  }

  signUp(): void {
    if (this.signUpForm.invalid)
      return;

    // Disable the form
    this.signUpForm.disable();

    // this._authService.signIn(this.signInForm.value)
    //   .subscribe({
    //     next: () => {
    //       this._alertService.success("Logged in successfully");
    //       this._navigationService.navigateToHome();
    //     },
    //     error: () => {
    //       this.signInForm.enable(); // Re-enable the form
    //     }
    //   });
  }
}
