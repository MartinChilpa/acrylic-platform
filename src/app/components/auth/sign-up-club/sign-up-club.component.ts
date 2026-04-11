import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AccountService } from '../../../services/account.service';
import { AlertService } from '../../../services/alert.service';
import { NavigationService } from '../../../services/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { PasswordValidatorDirective } from '../../../directives/password-validator.directive';

@Component({
  selector: 'acrylic-sign-up-club',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    PasswordValidatorDirective,
  ],
  templateUrl: './sign-up-club.component.html',
  styleUrl: './sign-up-club.component.scss'
})
export class SignUpClubComponent implements OnInit {

  signUpForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;

  
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
      type: ['club', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

 
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirm = formGroup.get('password_confirm')?.value;
    const confirmControl = formGroup.get('password_confirm');

    if (password === confirm) {
      confirmControl?.setErrors(null);
    } else {
      confirmControl?.setErrors({ mismatch: true });
    }
  }

  signUp(): void {
    if (this.signUpForm.invalid) return;

    this.signUpForm.disable();

    this._accountService.registration(this.signUpForm.value)
      .subscribe({
        next: () => {
          this._alertService.success("Club registered successfully");
         
          this._navigationService.navigateToSignDocuments();
        },
        error: () => {
          this.signUpForm.enable();
        }
      });
  }
}
