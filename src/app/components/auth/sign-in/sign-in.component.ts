import { NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'acrylic-sign-in',
  standalone: true,
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    RouterLink
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
  private _alertService = inject(AlertService);

  ngOnInit(): void {
    this.signInForm = this._fb.group({
      username: ['demo', Validators.required],
      password: ['d3m0us3R!', Validators.required],
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
          this._alertService.success("Logged in successfully");
        },
        error: () => {
          this.signInForm.enable(); // Re-enable the form
          this._alertService.error("Invalid Email or Password");
        }
      });
  }
}
