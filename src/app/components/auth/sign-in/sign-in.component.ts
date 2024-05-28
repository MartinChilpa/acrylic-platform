import { NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import { NavigationService } from '../../../services/navigation.service';
import { SocialLoginButtonComponent } from '../social-login-button/social-login-button.component';
import { environment } from '../../../../environments/environment';

declare var google: any;

@Component({
  selector: 'acrylic-sign-in',
  standalone: true,
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    SocialLoginButtonComponent
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
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.initGoogleSignIn();
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

  initGoogleSignIn(): void {
    google.accounts.id.initialize({
      client_id: environment.GOOGLE_CLIENT_ID,
      ux_mode: "popup",
      callback: (response: any) => {
        console.log(response);
      }
    });

    google.accounts.id.renderButton(document.getElementById("google-btn"), {
      type: "standard", 
      text: "Sign In With Google", 
      theme: "outline",
      size: "large"
    });

    google.accounts.id.prompt();
  }

  signInWithGoogle(): void {
    google.accounts.id.prompt();
  }
}
