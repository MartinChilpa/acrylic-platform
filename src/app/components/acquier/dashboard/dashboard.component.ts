import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { HeaderComponent } from '../../shared/acquier/header/header.component';
import { SimilaritySearchComponent } from '../dashboard/components/similarity-search/similarity-search.component';
import { LocalMusicComponent } from '../dashboard/components/local-music/local-music.component';
import { TeamBrandingService } from '../../../services/team-branding.service';

@Component({
  selector: 'acrylic-dashboard',
  standalone: true,
  imports: [
    NgClass,
    TranslocoModule,
    HeaderComponent,
    SimilaritySearchComponent,
    LocalMusicComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})


export class DashboardComponent implements OnInit {
  private brandingService = inject(TeamBrandingService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private initialBranding = this.brandingService.getActiveBranding();
  teamName = this.initialBranding.teamName;
  teamLogo = this.initialBranding.teamLogo;
  tagline = this.initialBranding.tagline;
  primaryColor = this.initialBranding.primaryColor;
  secondaryColor = this.initialBranding.secondaryColor;

  showLocalMusic = true;

  @ViewChild(SimilaritySearchComponent) private similaritySearch?: SimilaritySearchComponent;

  ngOnInit(): void {
    const branding = this.brandingService.getActiveBranding();
    this.teamName = branding.teamName;
    this.teamLogo = branding.teamLogo;
    this.tagline = branding.tagline;
    this.primaryColor = branding.primaryColor;
    this.secondaryColor = branding.secondaryColor;
    this.brandingService.applyCssVars(branding);

    // Home in the sidenav points at the route we are already on, so Angular
    // rebuilds nothing — bring the page back to its initial state by hand.
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.goHome());
  }

  /** Back to the landing state: search cleared, New Local Music on screen. */
  goHome(): void {
    this.similaritySearch?.resetSearch();
    this.showLocalMusic = true;
  }

  onSimilaritySearched() {
    this.showLocalMusic = false;
  }

  /** A featured card was clicked: run its Spotify URL through the search. */
  onLocalTrackSelected(spotifyUrl: string): void {
    this.similaritySearch?.searchFromUrl(spotifyUrl);
  }

}
