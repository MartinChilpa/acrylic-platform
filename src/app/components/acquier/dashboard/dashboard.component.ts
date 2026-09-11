import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
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


export class DashboardComponent implements OnInit, AfterViewInit {
  /** Query param that seeds the search, so a result view has its own URL. */
  static readonly SEARCH_PARAM = 'q';

  private brandingService = inject(TeamBrandingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private initialBranding = this.brandingService.getActiveBranding();
  teamName = this.initialBranding.teamName;
  teamLogo = this.initialBranding.teamLogo;
  tagline = this.initialBranding.tagline;
  primaryColor = this.initialBranding.primaryColor;
  secondaryColor = this.initialBranding.secondaryColor;

  showLocalMusic = true;

  /** Seed already searched, so re-entering the same URL does not search twice. */
  private appliedSearchSeed: string | null = null;

  @ViewChild(SimilaritySearchComponent) private similaritySearch?: SimilaritySearchComponent;

  ngOnInit(): void {
    const branding = this.brandingService.getActiveBranding();
    this.teamName = branding.teamName;
    this.teamLogo = branding.teamLogo;
    this.tagline = branding.tagline;
    this.primaryColor = branding.primaryColor;
    this.secondaryColor = branding.secondaryColor;
    this.brandingService.applyCssVars(branding);

    // Opening straight into a search: hide New Local Music before the first
    // render so the cards do not flash on screen and then vanish.
    if (this.readSearchSeed()) {
      this.showLocalMusic = false;
    }

    // Home in the sidenav points at the route we are already on, so Angular
    // rebuilds nothing — reconcile the view with the URL by hand.
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.applyRouteState());
  }

  ngAfterViewInit(): void {
    // First pass for a plain page load, where the search component only exists
    // once the view has been created. Deferred to the next turn: running the
    // search here would change bindings Angular has just checked (NG0100).
    setTimeout(() => this.applyRouteState());
  }

  private readSearchSeed(): string {
    return (this.route.snapshot.queryParamMap.get(DashboardComponent.SEARCH_PARAM) ?? '').trim();
  }

  /**
   * Put the page in the state its URL describes: `?q=<url>` runs that search,
   * anything else is the landing view with New Local Music.
   */
  private applyRouteState(): void {
    if (!this.similaritySearch) {
      // View not built yet — ngAfterViewInit runs this again.
      return;
    }
    const seed = this.readSearchSeed();
    if (seed) {
      if (seed === this.appliedSearchSeed) {
        return;
      }
      this.appliedSearchSeed = seed;
      this.similaritySearch.searchFromUrl(seed);
      return;
    }
    this.appliedSearchSeed = null;
    this.goHome();
  }

  /** Back to the landing state: search cleared, New Local Music on screen. */
  goHome(): void {
    this.similaritySearch?.resetSearch();
    this.showLocalMusic = true;
  }

  onSimilaritySearched() {
    this.showLocalMusic = false;
  }

}
