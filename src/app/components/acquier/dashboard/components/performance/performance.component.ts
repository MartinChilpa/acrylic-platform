import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { HeaderComponent } from '../../../../shared/acquier/header/header.component';
import { TeamBrandingService } from '../../../../../services/team-branding.service';
import { PerformanceService } from '../../../../../services/performance.service';
import { PerformancePlatform, PerformanceTrack } from '../../../../../interfaces/response/performance.response';
import {
  AudienceComposition,
  AudienceSize,
  audienceComposition,
  DEFAULT_PERFORMANCE_FILTERS,
  EcuFilter,
  PERFORMANCE_PLATFORMS,
  PerformanceArtistRow,
  PerformanceFilters,
  PerformanceSort,
  countryName,
  formatAudience,
  groupTracksByArtist,
  matchesPerformanceFilters,
  pageWindow,
  sortPerformanceTracks,
} from '../../../../../utils/performance.utils';
import { SearchOutcome, searchCatalog } from '../../../../../utils/performance-search.utils';

type ResultTab = 'tracks' | 'artists';
type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'acrylic-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslocoModule, HeaderComponent],
  templateUrl: './performance.component.html',
  styleUrl: './performance.component.scss',
})
export class PerformanceComponent implements OnInit, OnDestroy {
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
  readonly pageSize = 10;

  /* State mirrored in the URL so "Back to results" lands on the same view. */
  search = '';
  tab: ResultTab = 'tracks';
  filters: PerformanceFilters = { ...DEFAULT_PERFORMANCE_FILTERS };
  sort: PerformanceSort = 'audience';
  page = 1;

  /** Set when the URL carries an explicit sort, which overrides a search ranking. */
  private sortChosen = false;

  loadState: LoadState = 'loading';
  updated: Date | null = null;
  private catalog: PerformanceTrack[] = [];
  private searchInput$ = new Subject<string>();

  /** How the current search was read; drives the hint under the search bar. */
  outcome: SearchOutcome = searchCatalog([], '');

  /* Derived from catalog + filters on every change. */
  filteredTracks: PerformanceTrack[] = [];
  artistRows: PerformanceArtistRow[] = [];
  originOptions: { code: string; name: string }[] = [];

  /** Track open in the side panel. */
  selectedTrack: PerformanceTrack | null = null;
  /** Track shown in the persistent player. */
  playerTrack: PerformanceTrack | null = null;
  licensingUuid: string | null = null;
  licenseError = false;

  readonly playingUuid = this.performanceService.playingUuid;
  readonly currentTime = this.performanceService.currentTime;
  readonly duration = this.performanceService.duration;

  ngOnInit(): void {
    this.brandingService.applyCssVars(this.branding);

    this.searchInput$.pipe(
      debounceTime(300),
      map(value => value.trim()),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(q => this.updateQuery({ q: q || null, page: null }));

    // Every URL change re-derives the view from the catalog loaded once below.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.readQuery(params);
      this.derive();
    });

    this.loadCatalog();
    this.transloco.langChanges$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.derive());
  }

  private loadCatalog(): void {
    this.loadState = 'loading';
    this.performanceService.loadCatalog().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: catalog => {
        this.catalog = catalog.tracks;
        this.updated = catalog.updated;
        this.loadState = 'ready';
        this.derive();
      },
      error: err => {
        console.error('[Performance] catalog load failed', err);
        this.catalog = [];
        this.loadState = 'error';
        this.derive();
      },
    });
  }

  ngOnDestroy(): void {
    this.performanceService.stopPreview();
  }

  /* ─────────── URL state ─────────── */

  private readQuery(params: ParamMap): void {
    this.search = params.get('q') ?? '';
    this.tab = params.get('tab') === 'artists' ? 'artists' : 'tracks';
    const platform = params.get('platform') as PerformancePlatform | null;
    this.filters = {
      origin: (params.get('origin') ?? '').toUpperCase(),
      platform: platform && this.platforms.some(p => p.key === platform) ? platform : '',
      size: (['under1m', '1to10m', 'over10m'].includes(params.get('size') ?? '') ? params.get('size') : 'any') as AudienceSize,
      ecu: (['available', 'notListed'].includes(params.get('ecu') ?? '') ? params.get('ecu') : 'any') as EcuFilter,
    };
    this.sortChosen = params.has('sort');
    this.sort = params.get('sort') === 'name' ? 'name' : 'audience';
    this.page = Math.max(1, Number(params.get('page')) || 1);
  }

  private updateQuery(changes: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: changes,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  clearSearch(): void {
    this.search = '';
    this.updateQuery({ q: null, page: null });
  }

  setTab(tab: ResultTab): void {
    this.updateQuery({ tab: tab === 'tracks' ? null : tab, page: null });
  }

  setFilter(key: keyof PerformanceFilters, value: string): void {
    const isDefault = value === '' || value === 'any';
    this.updateQuery({ [key]: isDefault ? null : value, page: null });
  }

  /** Always written to the URL: an explicit pick overrides a search ranking. */
  setSort(sort: PerformanceSort): void {
    this.updateQuery({ sort, page: null });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pageCount) { return; }
    this.updateQuery({ page: page === 1 ? null : page });
  }

  /** "View tracks" on an artist: search for them and show their tracks. */
  viewArtistTracks(row: PerformanceArtistRow): void {
    this.search = row.artist.name;
    this.updateQuery({ q: row.artist.name, tab: null, page: null });
  }

  /* ─────────── Derived view ─────────── */

  private derive(): void {
    const lang = this.transloco.getActiveLang();
    const codes = new Set(this.catalog.map(t => t.artist?.countryCode).filter((c): c is string => !!c));
    this.originOptions = [...codes]
      .map(code => ({ code, name: countryName(code, lang) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name));

    this.outcome = searchCatalog(this.catalog, this.search);
    const matching = this.outcome.tracks.filter(t => matchesPerformanceFilters(t, this.filters));
    // A search ranking (relevance, platform, audience) keeps its order unless
    // the user picked another sort.
    const keepOrder = this.outcome.ranked && !this.sortChosen;
    this.filteredTracks = keepOrder ? matching : sortPerformanceTracks(matching, this.sort);
    this.artistRows = groupTracksByArtist(this.filteredTracks, this.sort, keepOrder);

    if (this.selectedTrack && !this.catalog.some(t => t.uuid === this.selectedTrack!.uuid)) {
      this.selectedTrack = null;
    }
    if (!this.playerTrack && this.filteredTracks.length) {
      this.playerTrack = this.filteredTracks[0];
    }
  }

  get resultCount(): number {
    return this.tab === 'tracks' ? this.filteredTracks.length : this.artistRows.length;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.resultCount / this.pageSize));
  }

  get currentPage(): number {
    return Math.min(this.page, this.pageCount);
  }

  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get pageEnd(): number {
    return Math.min(this.pageStart + this.pageSize, this.resultCount);
  }

  get pagedTracks(): PerformanceTrack[] {
    return this.filteredTracks.slice(this.pageStart, this.pageEnd);
  }

  get pagedArtists(): PerformanceArtistRow[] {
    return this.artistRows.slice(this.pageStart, this.pageEnd);
  }

  get pages(): (number | null)[] {
    return pageWindow(this.currentPage, this.pageCount);
  }

  /** Every result belongs to one artist: the "Explore X's tracks" view. */
  get focusArtist(): string | null {
    if (this.outcome.mode !== 'text' || this.artistRows.length !== 1) { return null; }
    return this.artistRows[0].artist.name;
  }

  get hasActiveFilters(): boolean {
    const f = this.filters;
    return !!(f.origin || f.platform || f.size !== 'any' || f.ecu !== 'any');
  }

  resetFilters(): void {
    this.updateQuery({ origin: null, platform: null, size: null, ecu: null, page: null });
  }

  /* ─────────── Formatting ─────────── */

  audience(value: number | null | undefined, digits = 1): string {
    return formatAudience(value, digits) ?? this.transloco.translate('performance.unavailable');
  }

  origin(track: PerformanceTrack | null): string {
    return countryName(track?.artist?.countryCode, this.transloco.getActiveLang())
      ?? this.transloco.translate('performance.unavailable');
  }

  originName(code: string | null | undefined): string {
    return countryName(code, this.transloco.getActiveLang()) ?? this.transloco.translate('performance.unavailable');
  }

  /** Pie data for the panel; cached per track so change detection reuses it. */
  composition(track: PerformanceTrack): AudienceComposition {
    if (this.compositionFor !== track) {
      this.compositionFor = track;
      this.compositionCache = audienceComposition(track.artist);
    }
    return this.compositionCache!;
  }
  private compositionFor: PerformanceTrack | null = null;
  private compositionCache: AudienceComposition | null = null;

  platformLabel(key: PerformancePlatform | null): string {
    return this.platforms.find(p => p.key === key)?.label ?? this.transloco.translate('performance.unavailable');
  }

  platformColor(key: PerformancePlatform | null): string {
    return this.platforms.find(p => p.key === key)?.color ?? 'transparent';
  }

  /** Picks the singular or plural form of a `<key>One` / `<key>Other` pair. */
  plural(key: string, count: number, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`${key}${count === 1 ? 'One' : 'Other'}`, { count, ...params });
  }

  tierClass(track: PerformanceTrack): string {
    return track.tier === 'PreClear' ? 'preclear' : 'artist';
  }

  formatTime(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  get playerProgress(): number {
    const d = this.duration();
    return d ? Math.min(100, (this.currentTime() / d) * 100) : 0;
  }

  /* ─────────── Interaction ─────────── */

  openTrack(track: PerformanceTrack): void {
    this.selectedTrack = track;
    this.playerTrack = track;
    this.licenseError = false;
  }

  closeTrack(): void {
    this.selectedTrack = null;
  }

  togglePreview(track: PerformanceTrack, event?: Event): void {
    event?.stopPropagation();
    this.playerTrack = track;
    this.performanceService.togglePreview(track);
  }

  isPlaying(track: PerformanceTrack | null): boolean {
    return !!track && this.playingUuid() === track.uuid;
  }

  viewTrack(track: PerformanceTrack, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/brand/performance/track', track.uuid], {
      queryParams: this.route.snapshot.queryParams,
    });
  }

  /** Hands the track to the dashboard search, where the license flow lives. */
  licenseTrack(track: PerformanceTrack): void {
    if (this.licensingUuid) { return; }
    this.licensingUuid = track.uuid;
    this.licenseError = false;
    this.performanceService.getSpotifyUrl(track).pipe(
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(url => {
      this.licensingUuid = null;
      if (!url) {
        this.licenseError = true;
        return;
      }
      this.router.navigate(['/brand/dashboard'], { queryParams: { q: url } });
    });
  }

  retry(): void {
    this.loadCatalog();
  }

  /** Runs the suggested spelling ("Did you mean …?"). */
  applySuggestion(name: string): void {
    this.search = name;
    this.updateQuery({ q: name, page: null });
  }

  /** The place a search was read as: country names in the active language, or the city as typed. */
  get placeLabel(): string {
    const place = this.outcome.place;
    if (!place) { return ''; }
    if (place.kind === 'country') {
      const lang = this.transloco.getActiveLang();
      return place.key.split(',').map(code => countryName(code, lang) ?? code).join(' / ');
    }
    return place.label.replace(/\b\p{L}/gu, ch => ch.toUpperCase());
  }

  platformName(key: PerformancePlatform | null): string {
    return this.platforms.find(p => p.key === key)?.label ?? '';
  }

  onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(PerformanceComponent.COVER_FALLBACK)) { img.src = PerformanceComponent.COVER_FALLBACK; }
  }

  static readonly COVER_FALLBACK = 'assets/images/others/default.jpg';
  readonly coverFallback = PerformanceComponent.COVER_FALLBACK;
}
