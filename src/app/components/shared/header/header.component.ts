import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'acrylic-header',
  standalone: true,
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  public _authService = inject(AuthService);
  private _router = inject(Router);

  signOut(): void {
    this._authService.signOut();
    this.redirectToSignIn();
  }

  redirectToSignUp() {
    throw new Error('Sign up page is in progress');
    this._router.navigate(['auth/sign-up']);
  }

  redirectToSignIn() {
    this._router.navigate(['auth/sign-in']);
  }
}

// todo (later)
// isDarkTheme: boolean = true;
// toggleTheme(): void {
//   this.isDarkTheme = !this.isDarkTheme;
//   if (this.isDarkTheme) {
//     document.body.classList.remove('light-theme'); // To apply dark theme
//   } else {
//     document.body.classList.add('light-theme'); // To apply light theme
//   }
// }