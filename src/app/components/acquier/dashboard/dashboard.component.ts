import { Component, OnInit, inject } from '@angular/core';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { HeaderComponent } from '../../shared/acquier/header/header.component';
import { SimilaritySearchComponent } from '../dashboard/components/similarity-search/similarity-search.component';
import { LocalMusicComponent } from '../dashboard/components/local-music/local-music.component';
import { TeamBrandingService } from '../../../services/team-branding.service';

@Component({
  selector: 'acrylic-dashboard',
  standalone: true,
  imports: [
    NgClass,
    HeaderComponent,
    SimilaritySearchComponent,
    LocalMusicComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})


export class DashboardComponent implements OnInit {
  private brandingService = inject(TeamBrandingService);

  teamName = 'CF Montréal';
  teamLogo = 'assets/images/icons/logoMontreal.png';
  tagline = 'Tous ensemble, droit devant';
  primaryColor = '#003DA6';
  secondaryColor = '#FFFFFF';

  showLocalMusic = true;

  ngOnInit(): void {
    const branding = this.brandingService.getActiveBranding();
    this.teamName = branding.teamName;
    this.teamLogo = branding.teamLogo;
    this.tagline = branding.tagline;
    this.primaryColor = branding.primaryColor;
    this.secondaryColor = branding.secondaryColor;
    this.brandingService.applyCssVars(branding);
  }

  onSimilaritySearched() {
    this.showLocalMusic = false;
  }

}
