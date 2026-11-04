import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HeaderComponent } from '../../../../shared/acquier/header/header.component';
import { TeamBrandingService } from '../../../../../services/team-branding.service';
import { AudienceSearchService } from '../../../../../services/audience-search.service';
import { ProjectsService } from '../../../../../services/projects.service';
import { SaveToService } from '../../../../../services/save-to.service';
import { AudienceSearchPlatform, AudienceSearchTrack } from '../../../../../interfaces/response/audience-search.response';
import {
  AudienceComposition,
  AudienceSize,
  audienceComposition,
  DEFAULT_AUDIENCE_SEARCH_FILTERS,
  EcuFilter,
  AUDIENCE_SEARCH_PLATFORMS,
  AudienceSearchArtistRow,
  AudienceSearchFilters,
  AudienceSearchSort,
  SOCIAL_PLATFORMS,
  SocialFilter,
  sortBySocial,
  countryName,
  formatAudience,
  groupTracksByArtist,
  matchesAudienceSearchFilters,
  pageWindow,
  sortAudienceSearchTracks,
} from '../../../../../utils/audience-search.utils';
import { CountrySuggestion, SearchOutcome, searchCatalog, suggestCountries } from '../../../../../utils/audience-search-query.utils';

type ResultTab = 'tracks' | 'artists';
type LoadState = 'loading' | 'ready' | 'error';
/** landing: nothing searched yet (A1). artistTracks: one artist's tracks from "View tracks" (A3a). */
type ResultView = 'landing' | 'artists' | 'artistTracks' | 'tracks';

const SORTS: AudienceSearchSort[] = ['audience', 'audienceAsc', 'name'];

@Component({
  selector: 'acrylic-audience-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslocoModule, HeaderComponent],
  templateUrl: './audience-search.component.html',
  styleUrl: './audience-search.component.scss',
})
export class AudienceSearchComponent implements OnInit, OnDestroy {
  private audienceSearchService = inject(AudienceSearchService);
  private projectsService = inject(ProjectsService);
  private saveTo = inject(SaveToService);
  private brandingService = inject(TeamBrandingService);
  private transloco = inject(TranslocoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private host: ElementRef<HTMLElement> = inject(ElementRef);

  private branding = this.brandingService.getActiveBranding();
  teamName = this.branding.teamName;
  teamLogo = this.branding.teamLogo;
  tagline = this.branding.tagline;
  primaryColor = this.branding.primaryColor;
  secondaryColor = this.branding.secondaryColor;

  readonly platforms = AUDIENCE_SEARCH_PLATFORMS;
  readonly pageSize = 10;

  /** Text in the search box. Only Search or Enter turns it into `query`. */
  search = '';

  /* State mirrored in the URL so "Back to results" lands on the same view. */
  /** The submitted search (?q=). Empty means nothing searched yet. */
  query = '';
  tab: ResultTab = 'artists';
  /** Artist whose tracks "View tracks" opened (?artist=). */
  artistUuid: string | null = null;
  filters: AudienceSearchFilters = { ...DEFAULT_AUDIENCE_SEARCH_FILTERS };
  sort: AudienceSearchSort = 'audience';
  page = 1;

  /** Set when the URL carries an explicit sort, which overrides a search ranking. */
  private sortChosen = false;

  loadState: LoadState = 'loading';
  private catalog: AudienceSearchTrack[] = [];

  /** Country autocomplete under the search box. */
  suggestions: CountrySuggestion[] = [];
  activeSuggestion = -1;
  suggestionsOpen = false;

  /** How the current search was read; drives the hint under the search bar. */
  outcome: SearchOutcome = searchCatalog([], '');

  /* Derived from catalog + filters on every change. */
  filteredTracks: AudienceSearchTrack[] = [];
  artistRows: AudienceSearchArtistRow[] = [];
  originOptions: { code: string; name: string }[] = [];

  /** Catalog uuids of tracks in Saved tracks: drives "✓ Saved to…". */
  private savedUuids = new Set<string>();

  /** Track open in the side panel. */
  selectedTrack: AudienceSearchTrack | null = null;
  /** Track shown in the persistent player. */
  playerTrack: AudienceSearchTrack | null = null;
  licensingUuid: string | null = null;
  licenseError = false;

  readonly playingUuid = this.audienceSearchService.playingUuid;
  readonly currentTime = this.audienceSearchService.currentTime;
  readonly duration = this.audienceSearchService.duration;

  ngOnInit(): void {
    this.brandingService.applyCssVars(this.branding);

    // Coming back to the tab (sidenav, another page) with a bare URL: put the
    // last search, filters, sort and page back instead of starting over.
    const saved = this.audienceSearchService.listState;
    let restoring = !this.route.snapshot.queryParamMap.keys.length && !!saved && Object.keys(saved).length > 0;
    if (restoring) {
      this.router.navigate([], { relativeTo: this.route, queryParams: saved, replaceUrl: true });
    }

    // Every URL change re-derives the view from the catalog loaded once below.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (restoring && !params.keys.length) { return; }
      restoring = false;
      this.readQuery(params);
      this.audienceSearchService.listState = { ...this.route.snapshot.queryParams };
      this.derive();
    });

    this.projectsService.loadFavorites();
    this.projectsService.favorites$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(favorites => {
      this.savedUuids = new Set(favorites.map(f => this.projectsService.trackKey(f)).filter(Boolean));
    });

    this.loadCatalog();
    this.transloco.langChanges$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.derive());
  }

  private loadCatalog(): void {
    this.loadState = 'loading';
    this.audienceSearchService.loadCatalog().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: catalog => {
        this.catalog = catalog.tracks;
        this.loadState = 'ready';
        this.derive();
        this.scrollToLastOpened();
      },
      error: err => {
        console.error('[AudienceSearch] catalog load failed', err);
        this.catalog = [];
        this.loadState = 'error';
        this.derive();
      },
    });
  }

  ngOnDestroy(): void {
    this.audienceSearchService.stopPreview();
  }

  /** Back from a track: bring the row that was opened into view. */
  private scrollToLastOpened(): void {
    const uuid = this.audienceSearchService.lastOpenedUuid;
    if (!uuid) { return; }
    this.audienceSearchService.lastOpenedUuid = null;
    setTimeout(() => {
      const row = this.host.nativeElement.querySelector(`[data-track-uuid="${CSS.escape(uuid)}"]`);
      row?.scrollIntoView({ block: 'center' });
    });
  }

  /* ─────────── URL state ─────────── */

  private readQuery(params: ParamMap): void {
    const q = params.get('q') ?? '';
    // Paging or switching tabs keeps whatever is being typed; a new search shows its query.
    if (q !== this.query) { this.search = q; }
    this.query = q;
    // Results open on Artists; Tracks stays one click away.
    this.tab = params.get('tab') === 'tracks' ? 'tracks' : 'artists';
    this.artistUuid = this.tab === 'artists' ? params.get('artist') : null;
    const platform = params.get('platform') as AudienceSearchPlatform | null;
    this.filters = {
      origin: (params.get('origin') ?? '').toUpperCase(),
      platform: platform && this.platforms.some(p => p.key === platform) ? platform : '',
      size: (['under1m', '1to10m', 'over10m'].includes(params.get('size') ?? '') ? params.get('size') : 'any') as AudienceSize,
      ecu: (params.get('ecu') === 'available' ? 'available' : 'any') as EcuFilter,
      social: (SOCIAL_PLATFORMS as string[]).includes(params.get('social') ?? '') ? params.get('social') as SocialFilter : '',
      artistPromoOnly: params.get('promo') === '1',
    };
    const sort = params.get('sort') as AudienceSearchSort | null;
    this.sortChosen = !!sort && SORTS.includes(sort);
    this.sort = this.sortChosen ? sort! : 'audience';
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

  /** Typing only refreshes the country suggestions; nothing is searched yet (A2). */
  onSearchInput(value: string): void {
    this.updateSuggestions(value);
  }

  get canSearch(): boolean {
    return !!this.search.trim();
  }

  /** Search button or Enter. Every new search starts on the Artists tab. */
  runSearch(): void {
    const q = this.search.replace(/\s+/g, ' ').trim();
    if (!q) { return; }
    this.closeSuggestions();
    this.updateQuery({ q, tab: null, artist: null, page: null });
  }

  clearSearch(): void {
    this.search = '';
    this.closeSuggestions();
    this.updateQuery({ q: null, tab: null, artist: null, page: null });
  }

  /* ─────────── Country autocomplete ─────────── */

  private updateSuggestions(value: string): void {
    this.suggestions = this.loadState === 'ready'
      ? suggestCountries(value, this.catalog, this.transloco.getActiveLang())
      : [];
    this.activeSuggestion = -1;
    this.suggestionsOpen = this.suggestions.length > 0;
  }

  onSearchFocus(): void {
    this.updateSuggestions(this.search);
  }

  onSearchBlur(): void {
    this.closeSuggestions();
  }

  closeSuggestions(): void {
    this.suggestionsOpen = false;
    this.activeSuggestion = -1;
  }

  /** Arrow keys move through the list, Enter picks (or searches), Escape closes. */
  onSearchKeydown(event: KeyboardEvent): void {
    const count = this.suggestions.length;
    if (!this.suggestionsOpen || !count) {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.runSearch();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeSuggestion = (this.activeSuggestion + 1) % count;
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeSuggestion = this.activeSuggestion <= 0 ? count - 1 : this.activeSuggestion - 1;
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeSuggestion >= 0) {
          this.selectCountry(this.suggestions[this.activeSuggestion]);
        } else {
          this.runSearch();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeSuggestions();
        break;
      case 'Tab':
        this.closeSuggestions();
        break;
    }
  }

  /** A picked country runs a search for it, with that Artist origin filter. */
  selectCountry(suggestion: CountrySuggestion): void {
    this.search = suggestion.name;
    this.suggestions = [];
    this.closeSuggestions();
    this.updateQuery({ origin: suggestion.code, q: suggestion.name, tab: null, artist: null, page: null });
  }

  setTab(tab: ResultTab): void {
    this.updateQuery({ tab: tab === 'artists' ? null : tab, artist: null, page: null });
  }

  setFilter(key: keyof AudienceSearchFilters, value: string): void {
    const isDefault = value === '' || value === 'any';
    this.updateQuery({ [key]: isDefault ? null : value, page: null });
  }

  toggleArtistPromoOnly(): void {
    this.updateQuery({ promo: this.filters.artistPromoOnly ? null : '1', page: null });
  }

  /** Always written to the URL: an explicit pick overrides a search ranking. */
  setSort(sort: AudienceSearchSort): void {
    this.updateQuery({ sort, page: null });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pageCount) { return; }
    this.updateQuery({ page: page === 1 ? null : page });
  }

  /** A3a: the artist's tracks, keeping the query in the search box. */
  viewArtistTracks(row: AudienceSearchArtistRow): void {
    this.updateQuery({ artist: row.artist.uuid, page: null });
  }

  backToArtists(): void {
    this.updateQuery({ artist: null, page: null });
  }

  goToProjects(): void {
    this.saveTo.goToProjects();
  }

  /* ─────────── Derived view ─────────── */

  private derive(): void {
    const lang = this.transloco.getActiveLang();
    const codes = new Set(this.catalog.map(t => t.artist?.countryCode).filter((c): c is string => !!c));
    this.originOptions = [...codes]
      .map(code => ({ code, name: countryName(code, lang) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!this.query) {
      // A1: nothing is listed until a search is run.
      this.outcome = searchCatalog([], '');
      this.filteredTracks = [];
      this.artistRows = [];
      return;
    }

    this.outcome = searchCatalog(this.catalog, this.query);
    const matching = this.outcome.tracks.filter(t => matchesAudienceSearchFilters(t, this.filters));
    // A search ranking (relevance, platform, audience) keeps its order unless
    // the user picked another sort.
    // A social filter ranks by that platform's followers, on top of any search.
    const social = this.filters.social;
    const keepOrder = (this.outcome.ranked || !!social) && !this.sortChosen;
    this.filteredTracks = social && !this.sortChosen
      ? sortBySocial(matching, social)
      : keepOrder ? matching : sortAudienceSearchTracks(matching, this.sort);
    this.artistRows = groupTracksByArtist(this.filteredTracks, this.sort, keepOrder);

    if (this.selectedTrack && !this.catalog.some(t => t.uuid === this.selectedTrack!.uuid)) {
      this.selectedTrack = null;
    }
    if (!this.playerTrack && this.filteredTracks.length) {
      this.playerTrack = this.filteredTracks[0];
    }
  }

  get view(): ResultView {
    if (!this.query) { return 'landing'; }
    if (this.tab === 'tracks') { return 'tracks'; }
    return this.focusRow ? 'artistTracks' : 'artists';
  }

  /** The artist opened with "View tracks", if it is still in the results. */
  get focusRow(): AudienceSearchArtistRow | null {
    if (!this.artistUuid) { return null; }
    return this.artistRows.find(r => r.artist.uuid === this.artistUuid) ?? null;
  }

  /** Tracks listed in the current view (Tracks tab, or one artist's tracks). */
  private get listedTracks(): AudienceSearchTrack[] {
    return this.view === 'artistTracks' ? this.focusRow!.tracks : this.filteredTracks;
  }

  get resultCount(): number {
    return this.view === 'artists' ? this.artistRows.length : this.listedTracks.length;
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

  get pagedTracks(): AudienceSearchTrack[] {
    return this.listedTracks.slice(this.pageStart, this.pageEnd);
  }

  get pagedArtists(): AudienceSearchArtistRow[] {
    return this.artistRows.slice(this.pageStart, this.pageEnd);
  }

  get pages(): (number | null)[] {
    return pageWindow(this.currentPage, this.pageCount);
  }

  get hasActiveFilters(): boolean {
    const f = this.filters;
    return !!(f.origin || f.platform || f.size !== 'any' || f.ecu !== 'any' || f.social || f.artistPromoOnly);
  }

  /** Anything to clear: a search, typed text, a filter, a sort, or a non-default view. */
  get canClearAll(): boolean {
    return !!this.query || !!this.search.trim() || this.hasActiveFilters || this.sortChosen
      || this.tab !== 'artists' || !!this.artistUuid;
  }

  /** "Clear": back to the first screen (A1) with every filter, sort and view reset. */
  clearAll(): void {
    this.search = '';
    this.closeSuggestions();
    this.selectedTrack = null;
    this.playerTrack = null;
    this.audienceSearchService.stopPreview();
    this.audienceSearchService.listState = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  resetFilters(): void {
    this.updateQuery({ origin: null, platform: null, size: null, ecu: null, social: null, promo: null, artist: null, page: null });
  }

  /* ─────────── Saving ─────────── */

  isSaved(track: AudienceSearchTrack): boolean {
    return this.savedUuids.has(track.uuid);
  }

  /** A3a/A3b: the shared picker; a saved track opens on its current destinations (C2). */
  saveTrack(track: AudienceSearchTrack, event?: Event): void {
    event?.stopPropagation();
    this.saveTo.openPicker([{
      uuid: track.uuid,
      title: track.name || '–',
      artist: track.artist?.name || this.transloco.translate('audienceSearch.unknownArtist'),
    }]);
  }

  /* ─────────── Formatting ─────────── */

  audience(value: number | null | undefined, digits = 1): string {
    return formatAudience(value, digits) ?? this.transloco.translate('audienceSearch.unavailable');
  }

  origin(track: AudienceSearchTrack | null): string {
    return countryName(track?.artist?.countryCode, this.transloco.getActiveLang())
      ?? this.transloco.translate('audienceSearch.unavailable');
  }

  originName(code: string | null | undefined): string {
    return countryName(code, this.transloco.getActiveLang()) ?? this.transloco.translate('audienceSearch.unavailable');
  }

  /** Pie data for the panel; cached per track so change detection reuses it. */
  composition(track: AudienceSearchTrack): AudienceComposition {
    if (this.compositionFor !== track) {
      this.compositionFor = track;
      this.compositionCache = audienceComposition(track.artist);
    }
    return this.compositionCache!;
  }
  private compositionFor: AudienceSearchTrack | null = null;
  private compositionCache: AudienceComposition | null = null;

  platformLabel(key: AudienceSearchPlatform | null): string {
    return this.platforms.find(p => p.key === key)?.label ?? this.transloco.translate('audienceSearch.unavailable');
  }

  platformColor(key: AudienceSearchPlatform | null): string {
    return this.platforms.find(p => p.key === key)?.color ?? 'transparent';
  }

  /** Picks the singular or plural form of a `<key>One` / `<key>Other` pair. */
  plural(key: string, count: number, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`${key}${count === 1 ? 'One' : 'Other'}`, { count, ...params });
  }

  tierClass(track: AudienceSearchTrack): string {
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

  openTrack(track: AudienceSearchTrack): void {
    this.selectedTrack = track;
    this.playerTrack = track;
    this.licenseError = false;
  }

  closeTrack(): void {
    this.selectedTrack = null;
  }

  togglePreview(track: AudienceSearchTrack, event?: Event): void {
    event?.stopPropagation();
    this.playerTrack = track;
    this.audienceSearchService.togglePreview(track);
  }

  /** A preview link exists and has not failed to play. */
  canPreview(track: AudienceSearchTrack | null): boolean {
    return this.audienceSearchService.canPreview(track);
  }

  /** D2: the preview exists but would not load. */
  previewFailed(track: AudienceSearchTrack | null): boolean {
    return this.audienceSearchService.previewFailed(track);
  }

  retryPreview(track: AudienceSearchTrack): void {
    this.playerTrack = track;
    this.audienceSearchService.retryPreview(track);
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

  viewTrack(track: AudienceSearchTrack, event?: Event): void {
    event?.stopPropagation();
    const queryParams = { ...this.route.snapshot.queryParams };
    this.audienceSearchService.listState = queryParams;
    this.audienceSearchService.lastOpenedUuid = track.uuid;
    this.router.navigate(['/brand/audience-search/track', track.uuid], { queryParams });
  }

  /** Hands the track to the dashboard search, where the license flow lives. */
  licenseTrack(track: AudienceSearchTrack): void {
    if (this.licensingUuid) { return; }
    this.licensingUuid = track.uuid;
    this.licenseError = false;
    this.audienceSearchService.getSpotifyUrl(track).pipe(
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
    this.updateQuery({ q: name, tab: null, artist: null, page: null });
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

  platformName(key: AudienceSearchPlatform | null): string {
    return this.platforms.find(p => p.key === key)?.label ?? '';
  }

  onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(AudienceSearchComponent.COVER_FALLBACK)) { img.src = AudienceSearchComponent.COVER_FALLBACK; }
  }

  static readonly COVER_FALLBACK = 'assets/images/others/default.jpg';
  readonly coverFallback = AudienceSearchComponent.COVER_FALLBACK;
}
