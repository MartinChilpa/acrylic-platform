import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { HeaderComponent } from '../../../../../shared/acquier/header/header.component';
import { TeamBrandingService } from '../../../../../../services/team-branding.service';
import { AudienceSearchService } from '../../../../../../services/audience-search.service';
import { AudienceSearchPlatform, AudienceSearchTrack } from '../../../../../../interfaces/response/audience-search.response';
import { AUDIENCE_SEARCH_PLATFORMS, countryName, formatAudience } from '../../../../../../utils/audience-search.utils';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'acrylic-audience-search-track',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule, HeaderComponent],
  templateUrl: './audience-search-track.component.html',
  styleUrl: './audience-search-track.component.scss',
})
export class AudienceSearchTrackComponent implements OnInit, OnDestroy {
  private audienceSearchService = inject(AudienceSearchService);
  private brandingService = inject(TeamBrandingService);
  private transloco = inject(TranslocoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private branding = this.brandingService.getActiveBranding();
  teamName = this.branding.teamName;
  teamLogo = this.branding.teamLogo;
  tagline = this.branding.tagline;
  primaryColor = this.branding.primaryColor;
  secondaryColor = this.branding.secondaryColor;

  readonly platforms = AUDIENCE_SEARCH_PLATFORMS;

  loadState: LoadState = 'loading';
  track: AudienceSearchTrack | null = null;
  moreFromArtist: AudienceSearchTrack[] = [];
  licensing = false;
  licenseError = false;

  readonly playingUuid = this.audienceSearchService.playingUuid;
  readonly currentTime = this.audienceSearchService.currentTime;
  readonly duration = this.audienceSearchService.duration;

  ngOnInit(): void {
    this.brandingService.applyCssVars(this.branding);

    this.route.paramMap.pipe(
      map(params => params.get('uuid') ?? ''),
      tap(() => {
        this.loadState = 'loading';
        this.track = null;
        this.moreFromArtist = [];
        this.licenseError = false;
      }),
      switchMap(uuid => this.audienceSearchService.getTrack(uuid).pipe(
        catchError(err => {
          console.error('[AudienceSearch] track load failed', err);
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(track => {
      this.track = track;
      this.loadState = track ? 'ready' : 'error';
      if (track) { this.loadMoreFromArtist(track); }
    });
  }

  ngOnDestroy(): void {
    this.audienceSearchService.stopPreview();
  }

  private loadMoreFromArtist(track: AudienceSearchTrack): void {
    this.audienceSearchService.getArtistTracks(track.artistUuid).pipe(
      catchError(() => of([] as AudienceSearchTrack[])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(tracks => {
      this.moreFromArtist = tracks.filter(t => t.uuid !== track.uuid).slice(0, 5);
    });
  }

  /** Back to the list with the search, filters and page it was opened from. */
  backToResults(): void {
    this.router.navigate(['/brand/audience-search'], { queryParams: this.route.snapshot.queryParams });
  }

  viewTrack(track: AudienceSearchTrack): void {
    this.router.navigate(['/brand/audience-search/track', track.uuid], {
      queryParams: this.route.snapshot.queryParams,
    });
  }

  togglePreview(track: AudienceSearchTrack): void {
    this.audienceSearchService.togglePreview(track);
  }

  /** A preview link exists and has not failed to play. */
  canPreview(track: AudienceSearchTrack | null): boolean {
    return this.audienceSearchService.canPreview(track);
  }

  /** The preview is fetching or buffering. */
  isLoading(track: AudienceSearchTrack | null): boolean {
    return !!track && this.audienceSearchService.loadingUuid() === track.uuid;
  }

  /** The preview is loaded (playing or paused), so its position is shown. */
  isLoaded(track: AudienceSearchTrack | null): boolean {
    return !!track && this.audienceSearchService.loadedUuid() === track.uuid;
  }

  isPlaying(track: AudienceSearchTrack | null): boolean {
    return !!track && this.playingUuid() === track.uuid;
  }

  /** Hands the track to the dashboard search, where the license flow lives. */
  licenseTrack(track: AudienceSearchTrack): void {
    if (this.licensing) { return; }
    this.licensing = true;
    this.licenseError = false;
    this.audienceSearchService.getSpotifyUrl(track).pipe(
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(url => {
      this.licensing = false;
      if (!url) {
        this.licenseError = true;
        return;
      }
      this.router.navigate(['/brand/dashboard'], { queryParams: { q: url } });
    });
  }

  /* ─────────── Formatting ─────────── */

  audience(value: number | null | undefined, digits = 1): string {
    return formatAudience(value, digits) ?? this.transloco.translate('audienceSearch.unavailable');
  }

  get origin(): string {
    return countryName(this.track?.artist?.countryCode, this.transloco.getActiveLang())
      ?? this.transloco.translate('audienceSearch.unavailable');
  }

  get artistName(): string {
    return this.track?.artist?.name || this.transloco.translate('audienceSearch.unknownArtist');
  }

  /** Bar length relative to the artist's largest platform. */
  barWidth(platform: AudienceSearchPlatform): number {
    const audience = this.track?.artist?.audience;
    if (!audience) { return 0; }
    const max = Math.max(...this.platforms.map(p => audience[p.key] ?? 0));
    return max ? ((audience[platform] ?? 0) / max) * 100 : 0;
  }

  tierClass(track: AudienceSearchTrack): string {
    return track.tier === 'PreClear' ? 'preclear' : 'artist';
  }

  formatTime(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  get progress(): number {
    const d = this.duration();
    return d ? Math.min(100, (this.currentTime() / d) * 100) : 0;
  }
}
