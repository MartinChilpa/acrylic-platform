import { Component, OnInit, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
declare var google: any;
@Component({
  selector: 'acrylic-social-login-button',
  standalone: true,
  imports: [],
  templateUrl: './social-login-button.component.html',
  styleUrl: './social-login-button.component.scss'
})
export class SocialLoginButtonComponent implements OnInit {
  private _authService = inject(AuthService)

  ngOnInit(): void {
    this.initGoogleSignIn();
  }

  socialJwt(token: any) {
    this._authService.socialJwtPair({
      code: token,
      provider: 'google'
    }).subscribe();
  }

  initGoogleSignIn(): void {
    google.accounts.id.initialize({
      client_id: environment.GOOGLE_CLIENT_ID,
      ux_mode: "popup",
      callback: (response: any) => {
        this.socialJwt(response.credential)
      }
    });

    google.accounts.id.renderButton(document.getElementById("google-btn"), {
      type: "standard",
      text: "Sign In With Google",
      theme: "outline",
      size: "large",
      align: 'center',
      // width: 200,
      classes: 'w-100'
    });
  }
}
