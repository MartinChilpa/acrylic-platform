import { NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { AlertService } from '../../../../services/alert.service';
import { NavigationService } from '../../../../services/navigation.service';
import { TeamBrandingService } from '../../../../services/team-branding.service';
import { SocialLoginButtonComponent } from '../../social-login-button/social-login-button.component';
import { TeamBranding } from '../../../../services/team-branding.service';

@Component({
  selector: 'acrylic-sign-in-club',
  standalone: true,
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    SocialLoginButtonComponent
  ],
  templateUrl: './sign-in-club.component.html',
  styleUrl: './sign-in-club.component.scss'
})
export class SignInClubComponent {
  showPassword = false;
  signInForm!: FormGroup;
  teamName = 'CF Montréal';

  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _alertService = inject(AlertService);
  public _navigationService = inject(NavigationService);
  private route = inject(ActivatedRoute);
  private brandingService = inject(TeamBrandingService);

  ngOnInit(): void {
    this.signInForm = this._fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    const resolvedBranding = this.route.parent?.snapshot.data['branding'] as TeamBranding | undefined;
    const teamSlug = this.route.parent?.snapshot.paramMap.get('teamSlug');
    const branding = resolvedBranding ?? this.brandingService.getBranding(teamSlug);
    this.teamName = branding.teamName;
  }

  signIn(): void {
    if (this.signInForm.invalid) return;
    this.signInForm.disable();
    this._authService.signIn(this.signInForm.value)
      .subscribe({
        next: () => {
          this._alertService.success("Logged in successfully");
          // For CF Montréal auth entrypoint, always land on Brand dashboard.
          const teamSlug = this.route.parent?.snapshot.paramMap.get('teamSlug');
          if (teamSlug) {
            this.brandingService.setActiveTeamSlug(teamSlug);
            this.brandingService.applyCssVars(this.brandingService.getBranding(teamSlug));
          }
          this._navigationService.navigateToBrandDashboard();
        },
        error: () => {
          this.signInForm.enable();
        }
      });
  }

}
