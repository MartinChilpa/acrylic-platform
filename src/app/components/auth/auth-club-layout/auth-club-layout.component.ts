import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

import { HeaderComponent } from '../../shared/header/header.component';
import { TeamBranding, TeamBrandingService } from '../../../services/team-branding.service';

@Component({
  selector: 'acrylic-auth-club-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './auth-club-layout.component.html',
  styleUrl: './auth-club-layout.component.scss'
})
export class AuthClubLayoutComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private brandingService = inject(TeamBrandingService);

  branding: TeamBranding = this.brandingService.getBranding(this.route.snapshot.paramMap.get('teamSlug'));
  promoImageSrc = this.branding.authPromo.imageSrc;
  promoImageAlt = this.branding.authPromo.imageAlt;
  promoTagline = this.branding.authPromo.tagline;

  private appliedBodyClass: string | null = null;

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const resolvedBranding = data['branding'] as TeamBranding | undefined;
      const teamSlug = this.route.snapshot.paramMap.get('teamSlug');
      this.branding = resolvedBranding ?? this.brandingService.getBranding(teamSlug);
      this.promoImageSrc = this.branding.authPromo.imageSrc;
      this.promoImageAlt = this.branding.authPromo.imageAlt;
      this.promoTagline = this.branding.authPromo.tagline;

      this.brandingService.applyCssVars(this.branding);

      document.body.classList.remove('bg-primary');
      document.body.classList.remove('bg-primary-gradient');
      document.body.classList.remove('bg-primary-gradient-montreal');
      const bodyClass = this.branding.authPromo.bodyClass ?? 'bg-primary-gradient';
      document.body.classList.add(bodyClass);
      this.appliedBodyClass = bodyClass;
    });
  }

  ngOnDestroy(): void {
    if (this.appliedBodyClass) {
      document.body.classList.remove(this.appliedBodyClass);
    }
  }
}
