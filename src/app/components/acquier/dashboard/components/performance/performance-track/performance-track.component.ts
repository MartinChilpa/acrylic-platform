import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { HeaderComponent } from '../../../../../shared/acquier/header/header.component';
import { TeamBrandingService } from '../../../../../../services/team-branding.service';
import { PerformanceService } from '../../../../../../services/performance.service';
import { PerformancePlatform, PerformanceTrack } from '../../../../../../interfaces/response/performance.response';
import { PERFORMANCE_PLATFORMS, countryName, formatAudience } from '../../../../../../utils/performance.utils';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'acrylic-performance-track',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule, HeaderComponent],
  templateUrl: './performance-track.component.html',
  styleUrl: './performance-track.component.scss',
})
export class PerformanceTrackComponent implements OnInit, OnDestroy {
  private performanceService = inject(PerformanceService);
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

  readonly platforms = PERFORMANCE_PLATFORMS;

  loadState: LoadState = 'loading';
  track: PerformanceTrack | null = null;
  moreFromArtist: PerformanceTrack[] = [];
  licensing = false;
  licenseError = false;

  readonly playingUuid = this.performanceService.playingUuid;
  readonly currentTime = this.performanceService.currentTime;
  readonly duration = this.performanceService.duration;

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
      switchMap(uuid => this.performanceService.getTrack(uuid).pipe(
        catchError(err => {
          console.error('[Performance] track load failed', err);
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
    this.performanceService.stopPreview();
  }

  private loadMoreFromArtist(track: PerformanceTrack): void {
    this.performanceService.getArtistTracks(track.artistUuid).pipe(
      catchError(() => of([] as PerformanceTrack[])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(tracks => {
      this.moreFromArtist = tracks.filter(t => t.uuid !== track.uuid).slice(0, 5);
    });
  }

  /** Back to the list with the search, filters and page it was opened from. */
  backToResults(): void {
    this.router.navigate(['/brand/performance'], { queryParams: this.route.snapshot.queryParams });
  }

  viewTrack(track: PerformanceTrack): void {
    this.router.navigate(['/brand/performance/track', track.uuid], {
      queryParams: this.route.snapshot.queryParams,
    });
  }

  togglePreview(track: PerformanceTrack): void {
    this.performanceService.togglePreview(track);
  }

  /** A preview link exists and has not failed to play. */
  canPreview(track: PerformanceTrack | null): boolean {
    return this.performanceService.canPreview(track);
  }

  /** The preview is fetching or buffering. */
  isLoading(track: PerformanceTrack | null): boolean {
    return !!track && this.performanceService.loadingUuid() === track.uuid;
  }

  /** The preview is loaded (playing or paused), so its position is shown. */
  isLoaded(track: PerformanceTrack | null): boolean {
    return !!track && this.performanceService.loadedUuid() === track.uuid;
  }

  isPlaying(track: PerformanceTrack | null): boolean {
    return !!track && this.playingUuid() === track.uuid;
  }

  /** Hands the track to the dashboard search, where the license flow lives. */
  licenseTrack(track: PerformanceTrack): void {
    if (this.licensing) { return; }
    this.licensing = true;
    this.licenseError = false;
    this.performanceService.getSpotifyUrl(track).pipe(
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
    return formatAudience(value, digits) ?? this.transloco.translate('performance.unavailable');
  }

  get origin(): string {
    return countryName(this.track?.artist?.countryCode, this.transloco.getActiveLang())
      ?? this.transloco.translate('performance.unavailable');
  }

  get artistName(): string {
    return this.track?.artist?.name || this.transloco.translate('performance.unknownArtist');
  }

  /** Bar length relative to the artist's largest platform. */
  barWidth(platform: PerformancePlatform): number {
    const audience = this.track?.artist?.audience;
    if (!audience) { return 0; }
    const max = Math.max(...this.platforms.map(p => audience[p.key] ?? 0));
    return max ? ((audience[platform] ?? 0) / max) * 100 : 0;
  }

  tierClass(track: PerformanceTrack): string {
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
