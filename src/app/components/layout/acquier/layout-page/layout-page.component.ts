import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { HeaderComponent } from '../../../shared/acquier/header/header.component';
import { TeamBrandingService } from '../../../../services/team-branding.service';

@Component({
  selector: 'acrylic-layout-page',
  standalone: true,
  imports: [
    RouterOutlet,
    SidenavComponent,
    HeaderComponent
  ],
  templateUrl: './layout-page.component.html',
  styleUrl: './layout-page.component.scss'
})
export class LayoutPageComponent implements OnInit, OnDestroy {
  private brandingService = inject(TeamBrandingService);
  private route = inject(ActivatedRoute);
  private appliedBodyClass: string | null = null;

  ngOnInit(): void {
    const resolvedBranding = this.route.snapshot.data['branding'];
    const branding = resolvedBranding ?? this.brandingService.getActiveBranding();
    this.brandingService.applyCssVars(branding);

    document.body.classList.remove('bg-primary-gradient');
    document.body.classList.remove('bg-primary-gradient-montreal');
    document.body.classList.add('bg-primary');
    this.appliedBodyClass = 'bg-primary';
  }

  ngOnDestroy(): void {
    if (this.appliedBodyClass) {
      document.body.classList.remove(this.appliedBodyClass);
    }
  }
}
