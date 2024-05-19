import { NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import { NavigationService } from '../../../services/navigation.service';

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
  private _alertService = inject(AlertService);
  public _navigationService = inject(NavigationService);

  ngOnInit(): void {
    this.signInForm = this._fb.group({
      username: ['', [Validators.required]],
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
          this._alertService.success("Logged in successfully");
          this._navigationService.navigateToHome();
        },
        error: () => {
          this.signInForm.enable(); // Re-enable the form
        }
      });
  }
}
