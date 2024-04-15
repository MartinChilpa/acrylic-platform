import { NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'acrylic-sign-in',
  standalone: true,
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent implements OnInit {
  showPassword = false;
  signInForm!: FormGroup;

  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _router = inject(Router);

  ngOnInit(): void {
    this.signInForm = this._fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  signIn(): void {
    if (this.signInForm.invalid)
      return;

    // Disable the form
    this.signInForm.disable();

    this._authService.signIn(this.signInForm.value)
      .subscribe({
        next: () => {
          this._router.navigateByUrl('/home');
          // this._alertService.show('Logged In Successfully', '', 'sb-success');
        },
        error: () => {
          // Re-enable the form
          this.signInForm.enable();
          // this._alertService.show('Invalid Email or Password', '', 'sb-error');
        }
      });
  }
}
