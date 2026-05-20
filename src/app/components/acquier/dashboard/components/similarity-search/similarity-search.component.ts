import { AfterViewInit, Component, Output, EventEmitter, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { EMPTY, Subject, defer, of } from 'rxjs';
import { catchError, expand, last, map, switchMap, tap } from 'rxjs/operators';
import { ModalService } from '../../../../../services/modal.service';

import { SimilarityUrlService } from '../../services/similarity-url.service';
import { AimsDownloadService } from '../../services/aims-download.service';
import { LicenseComponent } from '../license/license.component';
import { TeamPlayerOptimizationComponent } from './team-player-optimization/team-player-optimization.component';
import { TeamPlayersService, TeamPlayerDto } from '../../../../../services/team-players.service';
import { TeamBrandingService } from '../../../../../services/team-branding.service';
interface Suggestion {
  icon: string;
  type: string;
  title: string;
  subtitle: string;
}

interface SpotifyTrackInfo {
  name: string | null;
  artist: string | null;
  artists: string[];
  image: string | null;
  isrc: string | null;
  spotify_id: string | null;
}

@Component({
  selector: 'acrylic-similarity-search',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, ReactiveFormsModule, LicenseComponent, FormsModule, TeamPlayerOptimizationComponent],
  templateUrl: './similarity-search.component.html',
  styleUrls: ['./similarity-search.component.base.scss', './similarity-search.component.scss']
})


export class SimilaritySearchComponent implements OnInit {

  @Output() searchInput = new EventEmitter<string>();
  @Output() searched = new EventEmitter<void>();
  
  private similarityService = inject(SimilarityUrlService);
  private aimsDownloadService = inject(AimsDownloadService);
  private modalService = inject(ModalService);
  private teamPlayersService = inject(TeamPlayersService);
  private brandingService = inject(TeamBrandingService);
  private readonly dummyHighlights = [
    { offset: 25.088, duration: 45.72 },
    { offset: 94.208, duration: 44.184 },
    { offset: 169.472, duration: 18.072 }
  ];

  
  searchQuery: string = '';
  showDropdown: boolean = false;
  private sameQueryCooldownMs = 3000;
  private lastQuery = '';
  private lastQueryAt = 0;
  searchControl = new FormControl('');
  private manualSearch$ = new Subject<{ type: 'url' | 'prompt' | 'video'; query?: string; file?: File }>();
  private peaksLib: any | null = null;
  private peaksInstances = new Map<string, any>();
  private waveformErrors = new Map<string, string>();
  private waveformLoading = new Set<string>();
  private playingTrackKeys = new Set<string>();
  private openedPanels = new Set<string>();
  private trackTimes = new Map<string, { current: number; duration: number }>();
  private timerRafIds = new Map<string, number>();
  private peaksInitTimerId: number | null = null;

  suggestions: Suggestion[] = [
    { icon: '', type: 'prompt', title: 'Write a prompt', subtitle: 'Rosalia-style dance for chase scene' },
    { icon: '', type: 'video', title: 'Upload a video', subtitle: 'up to 60 sec / 60 MB' },
    { icon: '', type: 'link', title: 'Paste a link', subtitle: 'Paste a link. Get matches to similar tracks.' },
    { icon: '', type: 'track', title: 'Find a specific track', subtitle: 'Search title and artist.' },
  ];

  
  results: any[] = [];
  pageSize = 10;
  pageNumber = 1;
  totalCount: number | null = null;
  maxPrefetchResults = 30;
  allResultsRaw: any[] = [];
  allResults: any[] = [];
  private artistCountryFilterCode2: string | null = null;
  noPlayerMatchLabel: string | null = null;
  optimizationResetKey = 0;
  private lastSearchRequest: { type: 'url' | 'prompt' | 'video'; query?: string; file?: File } | null = null;
  lastSearchLabel = '';
  globalFileWav: string | null = null;
  selectedVideoFile: File | null = null;
  selectedVideoUrl: string | null = null;
  selectedVideoName: string | null = null;
  showSearchInfo = false;
  loading = false;
  errorMsg: string | null = null;
  private loadingStartedAt = 0;
  private loadingEndTimerId: number | null = null;
  private readonly minLoadingMs = 1800;

  licenseModalTrack: any | null = null;
  licensedTrack: any | null = null;
  paidMediaAddOn = false;
  generalTermsOpen = false;
  downloadingLicensedTrack = false;

  spotifyTrack: SpotifyTrackInfo | null = null;
  existsInDb: boolean | null = null;
  aimsStatusCode: number | null = null;
  seedTrack: any | null = null;
  seedInCatalog: boolean | null = null;
  teamPlayers: Array<{ id: string; name: string; countryCode2?: string | null }> = [];
  @ViewChildren('audioRef') private audioRefs!: QueryList<ElementRef<HTMLAudioElement>>;
  @ViewChildren('waveOverviewRef') private waveOverviewRefs!: QueryList<ElementRef<HTMLDivElement>>;

  ngOnInit() {
    this.loadClubPlayers();
    this.manualSearch$.pipe(
      tap(() => {
        this.startLoadingUi();
        this.loading = true;
        this.errorMsg = null;
        this.spotifyTrack = null;
        this.existsInDb = null;
        this.aimsStatusCode = null;
        this.seedTrack = null;
        this.seedInCatalog = null;
        this.waveformLoading.clear();
      }),
      switchMap((request) => {
        return this.fetchUpToMaxResults(request).pipe(
          catchError(() => {
            this.errorMsg = 'Error en busqueda. Revisa la consola.';
            return of({ firstData: null, results: [] as any[] });
          })
        );
      })
    ).subscribe((payload: { firstData: unknown | null; results: any[] }) => {
      const data = payload.firstData;
      this.logBackendResponse(data);
      this.destroyAllPeaks();
      this.waveformErrors.clear();
      this.globalFileWav = this.extractGlobalFileWav(data);
      this.allResultsRaw = this.dedupeResults(payload.results);
      this.totalCount = this.extractTotalCount(data);
      this.spotifyTrack = this.extractSpotifyTrack(data);
      this.existsInDb = this.extractExistsInDb(data);
      this.aimsStatusCode = this.extractAimsStatusCode(data);
      const seed = this.extractSeedTrack(data);
      this.seedInCatalog = seed.inCatalog;
      this.seedTrack = seed.inCatalog ? seed.track : null;
      if (this.existsInDb === null && this.seedInCatalog !== null) {
        this.existsInDb = this.seedInCatalog;
      }
      if (this.seedTrack) {
        this.allResultsRaw = this.removeFirstResultByKey(this.allResultsRaw, this.getResultStableKey(this.seedTrack));
      }
      this.applyCountryFilter();
      this.updateResultsSlice();
      this.finishLoadingUi();
      this.schedulePeaksInit();
    });
  }

  onOptimizationSelected(selection: string): void {
    const value = (selection ?? '').toString().trim();
    if (!value) {
      this.artistCountryFilterCode2 = null;
      this.noPlayerMatchLabel = null;
      this.optimizationResetKey++;
      this.applyCountryFilter();
      this.pageNumber = 1;
      this.handlePageChange();
      return;
    }

    if (value === 'team') {
      const teamCountry = (this.brandingService.getActiveBranding().countryCode2 ?? '').toString().trim().toUpperCase();
      this.artistCountryFilterCode2 = teamCountry || null;
      this.noPlayerMatchLabel = null;

      const next = this.getFilteredResultsOrNull();
      if (!next) {
        this.artistCountryFilterCode2 = null;
        this.noPlayerMatchLabel = 'No matches for Team.';
        this.optimizationResetKey++;
        this.applyCountryFilter();
        this.pageNumber = 1;
        this.handlePageChange();
        return;
      }

      this.allResults = next;
      this.pageNumber = 1;
      this.handlePageChange();
      return;
    }

    const player = this.teamPlayers.find((p) => p.id === value);
    this.artistCountryFilterCode2 = (player?.countryCode2 ?? null)?.toString().trim().toUpperCase() || null;
    this.noPlayerMatchLabel = null;

    const next = this.getFilteredResultsOrNull();
    if (!next) {
      this.artistCountryFilterCode2 = null;
      this.noPlayerMatchLabel = `No matches for ${player?.name ?? 'selected player'}.`;
      // Behave like "Clear optimization": restore the unfiltered results, but show the label.
      this.optimizationResetKey++;
      this.applyCountryFilter();
      this.pageNumber = 1;
      this.handlePageChange();
      return;
    }

    this.allResults = next;
    this.pageNumber = 1;
    this.handlePageChange();
  }

  private applyCountryFilter(): void {
    const next = this.getFilteredResultsOrNull();
    if (!next) {
      this.allResults = this.allResultsRaw;
      return;
    }
    this.allResults = next;
  }

  private getFilteredResultsOrNull(): any[] | null {
    const filter = (this.artistCountryFilterCode2 ?? '').toString().trim().toUpperCase();
    if (!filter) {
      return this.allResultsRaw;
    }
    // Keep tracks without country info ("lo dejamos") while filtering by player origin.
    const filtered = (this.allResultsRaw ?? []).filter((r) => {
      const code2 = (r?.artist_country_code2 ?? '').toString().trim().toUpperCase();
      return !code2 || code2 === filter;
    });
    // If nothing matches (and none are missing country), do not apply.
    const hasAny = filtered.length > 0;
    if (!hasAny) {
      return null;
    }
    return filtered;
  }

  private loadClubPlayers(): void {
    const slug = this.brandingService.getStoredTeamSlugOrNull();
    if (!slug) {
      this.teamPlayers = [];
      return;
    }

    this.teamPlayersService.getTeamPlayers(slug).pipe(
      map((resp) => Array.isArray(resp?.players) ? resp.players : []),
      catchError(() => of([] as TeamPlayerDto[])),
    ).subscribe((players) => {
      this.teamPlayers = players
        .map((p) => ({
          id: (p?.id ?? '').toString(),
          name: (p?.name ?? '').toString(),
          countryCode2: (p?.country_code2 ?? '').toString().trim().toUpperCase() || null,
        }))
        .filter((p) => !!p.id && !!p.name);
    });
  }

  private startLoadingUi(): void {
    this.loadingStartedAt = Date.now();
    if (this.loadingEndTimerId !== null) {
      clearTimeout(this.loadingEndTimerId);
      this.loadingEndTimerId = null;
    }
  }

  private finishLoadingUi(): void {
    const elapsed = Date.now() - this.loadingStartedAt;
    const remaining = Math.max(0, this.minLoadingMs - elapsed);
    if (this.loadingEndTimerId !== null) {
      clearTimeout(this.loadingEndTimerId);
    }
    this.loadingEndTimerId = window.setTimeout(() => {
      this.loadingEndTimerId = null;
      // Give the browser a chance to paint the results before removing the loader.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.loading = false;
        });
      });
    }, remaining);
  }

  private extractSeedTrack(data: unknown): { inCatalog: boolean | null; track: any | null } {
    if (!data || typeof data !== 'object') {
      return { inCatalog: null, track: null };
    }
    const record = data as Record<string, unknown>;
    const seed = record['seed_track'];
    if (!seed || typeof seed !== 'object') {
      return { inCatalog: null, track: null };
    }
    const s = seed as Record<string, unknown>;
    const inCatalog = typeof s['in_catalog'] === 'boolean' ? s['in_catalog'] : null;
    const track = s['track'];
    if (!track || typeof track !== 'object') {
      return { inCatalog, track: null };
    }
    return { inCatalog, track };
  }

  private isBackendResponseDebugEnabled(): boolean {
    try {
      return localStorage.getItem('debug_similarity_response') === '1';
    } catch {
      return false;
    }
  }

  private logBackendResponse(data: unknown): void {
    if (!this.isBackendResponseDebugEnabled()) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log('[aims similarity response]', data);
  }

  ngAfterViewInit(): void {
    this.audioRefs.changes.subscribe(() => {
      this.schedulePeaksInit();
    });
    this.waveOverviewRefs.changes.subscribe(() => {
      this.schedulePeaksInit();
    });
  }

  ngOnDestroy(): void {
    if (this.loadingEndTimerId !== null) {
      clearTimeout(this.loadingEndTimerId);
      this.loadingEndTimerId = null;
    }
    this.destroyAllPeaks();
    this.clearSelectedVideo();
  }


  selectSuggestion(suggestion: Suggestion) {
    this.searchQuery = suggestion.title;
    this.searchControl.setValue(suggestion.title);
    this.showDropdown = false;
  }

  get canSearch(): boolean {
    if (this.loading) {
      return false;
    }
    const query = (this.searchControl.value ?? '').trim();
    return !!query || !!this.selectedVideoFile;
  }

  search() {
    const query = (this.searchControl.value ?? '').trim();
    const now = Date.now();

    if (this.selectedVideoFile) {
      this.lastSearchLabel = this.selectedVideoName?.trim() || 'Uploaded video';
      this.searchInput.emit(this.lastSearchLabel);
      this.searched.emit();
      this.pageNumber = 1;
      this.lastSearchRequest = { type: 'video', file: this.selectedVideoFile };
      this.manualSearch$.next({ type: 'video', file: this.selectedVideoFile });
      return;
    }

    if (!query) {
      this.errorMsg = 'Pega una URL, escribe un prompt o sube un MP4.';
      return;
    }
    const isSameQuery = query === this.lastQuery;
    const withinCooldown = now - this.lastQueryAt < this.sameQueryCooldownMs;
    if (isSameQuery && withinCooldown) {
      this.errorMsg = `Espera ${Math.ceil((this.sameQueryCooldownMs - (now - this.lastQueryAt)) / 1000)}s para repetir la misma busqueda.`;
      return;
    }

    this.lastQuery = query;
    this.lastQueryAt = now;
    this.lastSearchLabel = query;
    this.searchInput.emit(query);
    if (this.isSupportedMediaUrl(query)) {
      this.searched.emit();
      this.pageNumber = 1;
      this.lastSearchRequest = { type: 'url', query };
      this.manualSearch$.next({ type: 'url', query });
      return;
    }
    this.searched.emit();
    this.pageNumber = 1;
    this.lastSearchRequest = { type: 'prompt', query };
    this.manualSearch$.next({ type: 'prompt', query });
  }

  get totalPages(): number | null {
    const total = this.allResults?.length ?? 0;
    return total > 0 ? Math.max(1, Math.ceil(total / this.pageSize)) : null;
  }

  get canGoPreviousPage(): boolean {
    return this.pageNumber > 1;
  }

  get canGoNextPage(): boolean {
    const totalPages = this.totalPages;
    if (totalPages !== null) {
      return this.pageNumber < totalPages;
    }
    return false;
  }

  private handlePageChange(): void {
    // Peaks instances are bound to DOM nodes; when paging, Angular can reuse/remove nodes.
    // Resetting ensures waveforms re-initialize for the new page.
    this.destroyAllPeaks();
    this.waveformErrors.clear();
    this.updateResultsSlice();
    this.schedulePeaksInit();
  }

  private schedulePeaksInit(): void {
    if (this.peaksInitTimerId !== null) {
      clearTimeout(this.peaksInitTimerId);
    }
    // Let Angular render first, then initialize Peaks to avoid blocking initial paint.
    this.peaksInitTimerId = window.setTimeout(() => {
      this.peaksInitTimerId = null;
      void this.initializePeaksForVisibleRows();
    }, 0);
  }

  goToPreviousPage(): void {
    if (this.loading || !this.canGoPreviousPage) {
      return;
    }
    this.pageNumber = Math.max(1, this.pageNumber - 1);
    this.handlePageChange();
  }

  goToNextPage(): void {
    if (this.loading || !this.canGoNextPage) {
      return;
    }
    this.pageNumber = this.pageNumber + 1;
    this.handlePageChange();
  }

  get displayTotalCount(): number {
    const fetched = this.allResults?.length ?? 0;
    const total = this.totalCount ?? 0;
    if (this.artistCountryFilterCode2) {
      return fetched;
    }
    // Some backends return `count` as page_size; prefer the fetched count in that case.
    if (total > 0 && total < fetched) {
      return fetched;
    }
    return total > 0 ? total : fetched;
  }

  private updateResultsSlice(): void {
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.results = (this.allResults ?? []).slice(start, end);
  }

  openLicenseTrackModal(track: any): void {
    this.licenseModalTrack = track;
    this.licensedTrack = null;
    this.paidMediaAddOn = false;
    this.generalTermsOpen = false;
    const trackedLicensedEl = document.getElementById('track-licensed-modal');
    const isTrackedVisible = trackedLicensedEl?.classList.contains('show');
    if (isTrackedVisible) {
      this.modalService.hideModal('track-licensed-modal');
      setTimeout(() => this.modalService.showModal('license-track-modal'), 350);
    } else {
      this.modalService.showModal('license-track-modal');
    }
  }

  confirmLicenseHappyPath(): void {
    this.licensedTrack = this.licenseModalTrack;
    this.modalService.hideModal('license-track-modal');
    setTimeout(() => {
      this.modalService.showModal('track-licensed-modal');
    }, 350);
  }

  resetLicenseFlow(): void {
    this.licenseModalTrack = null;
    this.licensedTrack = null;
    this.paidMediaAddOn = false;
    this.generalTermsOpen = false;
  }

  downloadLicensedTrack(): void {
    if (!this.licensedTrack) {
      return;
    }

    const url = this.getTrackAudioUrl(this.licensedTrack);
    if (!url) {
      return;
    }

    if (this.downloadingLicensedTrack) {
      return;
    }

    const filename = this.getTrackDownloadFilename(this.licensedTrack, url);
    this.downloadingLicensedTrack = true;
    this.aimsDownloadService.getPresignedDownloadUrl({ url, filename }).subscribe({
      next: (presignedUrl) => {
        if (!presignedUrl) {
          this.errorMsg = 'No se pudo descargar el track.';
          return;
        }

        this.triggerDownloadViaIframe(presignedUrl);

        this.modalService.hideModal('track-licensed-modal');
        this.resetLicenseFlow();
      },
      error: () => {
        this.errorMsg = 'No se pudo descargar el track.';
        this.downloadingLicensedTrack = false;
      },
      complete: () => {
        this.downloadingLicensedTrack = false;
      }
    });
  }

  private triggerDownloadViaIframe(url: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      iframe.remove();
    }, 60000);
  }

  private getTrackDownloadFilename(track: any, url: string): string {
    const artist = (track?.artist_canonical ?? track?.artist ?? '').toString().trim();
    const title = (track?.track_name ?? track?.track_name_track ?? track?.name ?? 'track').toString().trim();
    const base = this.sanitizeFilename(artist ? `${artist} - ${title}` : title) || 'track';
    const ext = this.extractFileExtension(url) ?? '.wav';
    return base.toLowerCase().endsWith(ext.toLowerCase()) ? base : `${base}${ext}`;
  }

  private sanitizeFilename(value: string): string {
    return (value ?? '')
      .replace(/[\u0000-\u001f\u007f]+/g, '')
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
  }

  private extractFileExtension(url: string): string | null {
    try {
      const resolved = new URL(url, window.location.href);
      const last = (resolved.pathname.split('/').pop() ?? '').trim();
      const dot = last.lastIndexOf('.');
      if (dot <= 0) {
        return null;
      }
      const ext = last.slice(dot);
      if (ext.length < 2 || ext.length > 6) {
        return null;
      }
      if (!/^\.[a-z0-9]+$/i.test(ext)) {
        return null;
      }
      return ext.toLowerCase();
    } catch {
      return null;
    }
  }

  toggleGeneralTerms(): void {
    this.generalTermsOpen = !this.generalTermsOpen;
  }

  copyTags(): void {
    const artist = this.licensedTrack?.artist_canonical ?? '';
    const track = this.licensedTrack?.track_name ?? this.licensedTrack?.track_name_track ?? '';
    const tier = this.getTierLabel(this.licensedTrack);
    const text = `Artist: ${artist}\nTrack: ${track}\nTier: ${tier}`.trim();

    try {
      navigator.clipboard?.writeText?.(text);
    } catch {
      // best-effort only
    }
  }


  private getPriceId(value: unknown): number | null {
    const n = Number((value as any)?.price_id ?? value);
    return Number.isFinite(n) ? n : null;
  }

  getTierLabel(track: any): string {
    const id = this.getPriceId(track);
    if (id === 1) return 'ArtistPromo';
    if (id === 2) return 'PreClear';
    if (id === 3) return 'Bid2Clear';
    return 'ArtistPromo';
  }

  getTierClass(track: any): string {
    const id = this.getPriceId(track);
    if (id === 1) return 'pt2-icon-tier--artistpromo';
    if (id === 3) return 'pt2-icon-tier--bid2clear';
    return 'pt2-icon-tier--artistpromo';
  }

  getResultThemeClass(track: any): string {
    const id = this.getPriceId(track);
    if (id === 1) return 'result-theme--artistpromo';
    if (id === 3) return 'result-theme--bid2clear';
    return 'result-theme--artistpromo';
  }

  getCountryFlagUrl(code2: string): string {
    const safe = (code2 ?? '').toString().trim().toLowerCase();
    return `https://flagcdn.com/16x12/${safe}.png`;
  }

  getArtistCountryCode2(track: any): string | null {
    const code2 = (track?.artist_country_code2 ?? '').toString().trim().toUpperCase();
    return code2.length === 2 ? code2 : null;
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }
    const file = input.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (file.type !== 'video/mp4' && !file.name.toLowerCase().endsWith('.mp4')) {
      this.errorMsg = 'Solo se permite formato MP4.';
      input.value = '';
      return;
    }

    this.clearSelectedVideo();
    this.searchQuery = '';
    this.searchControl.setValue('', { emitEvent: false });
    this.showDropdown = false;
    this.showSearchInfo = false;

    this.errorMsg = null;
    this.selectedVideoFile = file;
    this.selectedVideoName = file.name;
    this.selectedVideoUrl = URL.createObjectURL(file);
    this.showSearchInfo = false;

    // Allow selecting the same file again.
    input.value = '';
  }

  clearSelectedVideo(): void {
    if (this.selectedVideoUrl) {
      URL.revokeObjectURL(this.selectedVideoUrl);
    }
    this.selectedVideoFile = null;
    this.selectedVideoName = null;
    this.selectedVideoUrl = null;
  }

  onSearchInputFocus(): void {
    const query = (this.searchControl.value ?? '').trim();
    this.searchQuery = query;
    this.showDropdown = true;
    this.showSearchInfo = query.length === 0 && !this.selectedVideoFile;
  }

  onSearchInputChange(): void {
    const query = (this.searchControl.value ?? '').trim();
    this.searchQuery = query;
    if (query.length > 0 && this.selectedVideoFile) {
      this.clearSelectedVideo();
    }
    this.showDropdown = true;
    this.showSearchInfo = query.length === 0 && !this.selectedVideoFile;
  }

  onSearchInputBlur(): void {
    // Let suggestion clicks register before hiding dropdown.
    setTimeout(() => {
      this.showDropdown = false;
      this.showSearchInfo = false;
    }, 120);
  }

  private normalizeResponse(data: unknown): any[] {
    return this.findArrayInPayload(data) ?? [];
  }

  private extractGlobalFileWav(data: unknown): string | null {
    if (!data || typeof data !== 'object') {
      return null;
    }
    const record = data as Record<string, unknown>;
    return typeof record['file_wav'] === 'string' ? record['file_wav'] : null;
  }

  get spotifyTrackUrl(): string | null {
    const id = this.spotifyTrack?.spotify_id;
    if (!id) return null;
    return `https://open.spotify.com/track/${id}`;
  }

  private extractSpotifyTrack(data: unknown): SpotifyTrackInfo | null {
    if (!data || typeof data !== 'object') {
      return null;
    }
    const record = data as Record<string, unknown>;
    const spotify = record['spotify'];
    if (!spotify || typeof spotify !== 'object') {
      return null;
    }

    const s = spotify as Record<string, unknown>;
    const name = typeof s['name'] === 'string' ? s['name'] : null;
    if (!name) {
      return null;
    }

    const artists = Array.isArray(s['artists'])
      ? (s['artists'] as unknown[]).filter((x): x is string => typeof x === 'string')
      : [];

    return {
      name,
      artist: typeof s['artist'] === 'string' ? s['artist'] : null,
      artists,
      image: typeof s['image'] === 'string' ? s['image'] : null,
      isrc: typeof s['isrc'] === 'string' ? s['isrc'] : null,
      spotify_id: typeof s['spotify_id'] === 'string' ? s['spotify_id'] : null,
    };
  }

  private extractExistsInDb(data: unknown): boolean | null {
    if (!data || typeof data !== 'object') {
      return null;
    }
    const record = data as Record<string, unknown>;
    return typeof record['exists_in_db'] === 'boolean' ? record['exists_in_db'] : null;
  }

  private fetchUpToMaxResults(request: { type: 'url' | 'prompt' | 'video'; query?: string; file?: File }) {
    const pageSize = this.pageSize;
    const maxPages = Math.max(1, Math.ceil(this.maxPrefetchResults / pageSize));
    const isValidRequest = (request.type === 'video' && !!request.file)
      || (request.type === 'url' && !!request.query)
      || (request.type === 'prompt' && !!request.query);

    if (!isValidRequest) {
      this.errorMsg = 'No se pudo determinar el tipo de busqueda.';
      return of({ firstData: null, results: [] as any[] });
    }

    const fetchPage = (page: number) => {
      if (request.type === 'video' && request.file) {
        return this.similarityService.searchSimilarityByVideo(request.file, page, pageSize);
      }
      if (request.type === 'url' && request.query) {
        return this.similarityService.searchSimilarityByUrl(request.query, page, pageSize);
      }
      return this.similarityService.searchSimilarityByPrompt(request.query as string, page, pageSize);
    };

    return defer(() => fetchPage(1)).pipe(
      map((firstData: unknown) => {
        const items = this.normalizeResponse(firstData);
        return { firstData, page: 1, items, lastBatch: items.length };
      }),
      expand((state) => {
        const nextPage = state.page + 1;
        const shouldStop = nextPage > maxPages
          || state.items.length >= this.maxPrefetchResults
          || state.lastBatch < pageSize;
        if (shouldStop) {
          return EMPTY;
        }
        return fetchPage(nextPage).pipe(
          map((data: unknown) => {
            const batch = this.normalizeResponse(data);
            return {
              firstData: state.firstData,
              page: nextPage,
              items: [...state.items, ...batch],
              lastBatch: batch.length
            };
          })
        );
      }),
      last(),
      map((state) => ({ firstData: state.firstData, results: state.items.slice(0, this.maxPrefetchResults) }))
    );
  }

  private getResultStableKey(track: any): string {
    const id = track?.id ?? track?.uuid ?? track?.isrc ?? track?.spotify_id;
    if (id !== null && id !== undefined) {
      return String(id);
    }
    const waveform = track?.waveform ?? track?.waveform_url ?? track?.file_wav;
    if (typeof waveform === 'string' && waveform.trim()) {
      return waveform.trim();
    }
    const name = (track?.track_name ?? track?.track_name_track ?? track?.name ?? '').toString().trim();
    const artist = (track?.artist_canonical ?? track?.artist ?? '').toString().trim();
    return `${name}::${artist}`.toLowerCase();
  }

  private removeFirstResultByKey(items: any[], key: string): any[] {
    if (!key) {
      return items ?? [];
    }
    const out: any[] = [];
    let removed = false;
    for (const item of items ?? []) {
      if (!removed && this.getResultStableKey(item) === key) {
        removed = true;
        continue;
      }
      out.push(item);
    }
    return out;
  }

  private dedupeResults(items: any[]): any[] {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const item of items ?? []) {
      const key = this.getResultStableKey(item);
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  private extractTotalCount(data: unknown): number | null {
    if (!data || typeof data !== 'object') {
      return null;
    }
    const record = data as Record<string, unknown>;
    const preferred = ['total_count', 'total_results', 'totalResults', 'total_results_count', 'total'];
    for (const key of preferred) {
      const value = record[key];
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        return value;
      }
    }

    // `count` is ambiguous (can be page_size). Only trust it if it doesn't look like a page count.
    const count = record['count'];
    if (typeof count === 'number' && Number.isFinite(count) && count >= 0) {
      const pageSize = Number(record['page_size'] ?? record['pageSize']);
      if (!Number.isFinite(pageSize) || pageSize <= 0 || count > pageSize) {
        return count;
      }
    }

    for (const nested of Object.values(record)) {
      if (nested && typeof nested === 'object') {
        const found = this.extractTotalCount(nested);
        if (found !== null) {
          return found;
        }
      }
    }
    return null;
  }

  private formatUsd(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  }

  private formatUsdCents(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  getTrackLicensePrice(track: any): string | null {
    const raw = Number(track?.price ?? track?.license_price ?? track?.price_amount);
    if (!Number.isFinite(raw) || raw <= 0) return null;
    return this.formatUsd(raw);
  }

  getLicenseTotal(): string {
    const base = Number(this.licenseModalTrack?.price ?? this.licenseModalTrack?.license_price ?? this.licenseModalTrack?.price_amount);
    const id = this.getPriceId(this.licenseModalTrack);
    const isArtistPromo = this.getTierLabel(this.licenseModalTrack) === 'ArtistPromo' || id === 1;
    const addOn = this.paidMediaAddOn ? 300 : 0;

    if (isArtistPromo) {
      return addOn > 0 ? this.formatUsd(addOn) : this.formatUsdCents(0);
    }

    const baseAmount = Number.isFinite(base) && base > 0 ? base : 1500;
    const total = baseAmount + addOn;
    if (total <= 0) return 'Free';
    return this.formatUsd(total);
  }

  getLicenseModalSubtitle(track: any): string {
    const id = this.getPriceId(track);
    if (id === 1) return 'Cost of license included in your subscription. No extra fee needed.';
    const price = this.getTrackLicensePrice(track);
    return price ? `License price: ${price}` : 'Cost of license included in your subscription. No extra fee needed.';
  }


  private extractAimsStatusCode(data: unknown): number | null {
    if (!data || typeof data !== 'object') {
      return null;
    }
    const record = data as Record<string, unknown>;
    return typeof record['aims_status_code'] === 'number' ? record['aims_status_code'] : null;
  }

  private findArrayInPayload(value: unknown): any[] | null {
    if (Array.isArray(value)) {
      return value;
    }
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;

    for (const key of ['tracks', 'results', 'data', 'items', 'matches', 'payload']) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    for (const nested of Object.values(record)) {
      const found = this.findArrayInPayload(nested);
      if (found) {
        return found;
      }
    }

    return null;
  }

  getThumbnailPath(track: any): string | null {
    const thumbs = track?.thumbnails as Array<{ size?: string; path?: string }> | undefined;
    if (!Array.isArray(thumbs) || thumbs.length === 0) {
      return null;
    }

    const preferred = thumbs.find((t) => t?.size === '600x600')
      ?? thumbs.find((t) => t?.size === '80x80')
      ?? thumbs[0];

    return typeof preferred?.path === 'string' ? preferred.path : null;
  }

  getTrackImage(track: any): string {
    const coverImage = track?.cover_image;
    if (typeof coverImage === 'string' && coverImage.trim().length > 0) {
      return coverImage;
    }
    return this.getThumbnailPath(track) ?? 'assets/images/others/default.jpg';
  }

  formatDuration(totalSeconds: number | null | undefined): string {
    if (typeof totalSeconds !== 'number' || Number.isNaN(totalSeconds) || totalSeconds < 0) {
      return '--:--';
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  formatFollowers(value: unknown): string | null {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      return null;
    }
    return new Intl.NumberFormat('en-US').format(num);
  }

  getAudienceSize(track: any): string | null {
    const total = this.getAudienceSizeValue(track);
    if (total === null) {
      return null;
    }
    return new Intl.NumberFormat('en-US').format(total);
  }

  getAudienceSizeValue(track: any): number | null {
    const directCandidates: unknown[] = [
      track?.audience_size,
      track?.audience_size_total,
      track?.audience_total,
      track?.total_audience,
      track?.total_followers
    ];
    for (const value of directCandidates) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }

    const values = [
      Number(track?.spotify_followers ?? 0),
      Number(track?.tiktok_followers ?? 0),
      Number(track?.youtube_followers ?? 0),
      Number(track?.instagram_followers ?? 0)
    ];

    const validValues = values.filter((v) => Number.isFinite(v) && v > 0);
    if (!validValues.length) {
      return null;
    }

    return validValues.reduce((sum, v) => sum + v, 0);
  }

  getAudienceSizeIconPath(track: any): string {
    const total = this.getAudienceSizeValue(track);
    if (total === null) {
      return 'assets/images/icons/range/users-m.svg';
    }
    if (total < 10_000) {
      return 'assets/images/icons/range/users-l.svg';
    }
    if (total <= 100_000) {
      return 'assets/images/icons/range/users-m.svg';
    }
    return 'assets/images/icons/range/users.h.svg';
  }

  getFollowerBreakdown(track: any): Array<{ label: string; value: number; percent: number; color: string }> {
    const raw = [
      { label: 'Spotify', value: Number(track?.spotify_followers ?? 0), color: '#E79888' },
      { label: 'Instagram', value: Number(track?.instagram_followers ?? 0), color: '#8DC4C2' },
      { label: 'YouTube', value: Number(track?.youtube_followers ?? 0), color: '#FFCC8F' },
      { label: 'TikTok', value: Number(track?.tiktok_followers ?? 0), color: '#4B6095' }
    ].filter((item) => Number.isFinite(item.value) && item.value > 0);

    const total = raw.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) {
      return [];
    }

    return raw.map((item) => ({
      ...item,
      percent: Number(((item.value / total) * 100).toFixed(1))
    }));
  }

  getFollowersPieBackground(track: any): string | null {
    const breakdown = this.getFollowerBreakdown(track);
    if (!breakdown.length) {
      return null;
    }

    let start = 0;
    const stops = breakdown.map((item) => {
      const end = start + item.percent;
      const stop = `${item.color} ${start}% ${end}%`;
      start = end;
      return stop;
    });

    return `conic-gradient(${stops.join(', ')})`;
  }

  getInstagramDemographic(track: any, key: 'female' | 'male'): number | null {
    const source = track?.chartmetric_instagram_demographics;
    if (!source) {
      return null;
    }

    const parseValue = (value: unknown): number | null => {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };

    if (Array.isArray(source)) {
      for (const item of source) {
        if (item && typeof item === 'object') {
          const direct = (item as Record<string, unknown>)[key];
          const parsed = parseValue(direct);
          if (parsed !== null) {
            return parsed;
          }
        }
      }
      return null;
    }

    if (source && typeof source === 'object') {
      const direct = (source as Record<string, unknown>)[key];
      return parseValue(direct);
    }

    return null;
  }

  getGenderSplit(track: any): { female: number; male: number } | null {
    const female = this.getInstagramDemographic(track, 'female');
    const male = this.getInstagramDemographic(track, 'male');

    if (female === null && male === null) {
      return null;
    }

    const safeFemale = Math.max(0, female ?? 0);
    const safeMale = Math.max(0, male ?? 0);
    const total = safeFemale + safeMale;

    if (total <= 0) {
      return { female: 0, male: 0 };
    }

    return {
      female: Number(((safeFemale / total) * 100).toFixed(1)),
      male: Number(((safeMale / total) * 100).toFixed(1))
    };
  }

  getTopCityNames(track: any): string[] | null {
    const source = track?.chartmetric_instagram_top_cities;
    if (!Array.isArray(source) || source.length === 0) {
      return null;
    }

    const topCities = source
      .slice(0, 3)
      .map((item: unknown) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const city = (item as Record<string, unknown>)['city_name'];
        return typeof city === 'string' ? city.trim() : null;
      })
      .filter((city): city is string => !!city);

    return topCities.length ? topCities : null;
  }

  getTopCountries(track: any): Array<{ name: string; code2: string; flag: string }> | null {
    const source = track?.chartmetric_instagram_top_countries;
    if (!Array.isArray(source) || source.length === 0) {
      return null;
    }

    const topCountries = source
      .slice(0, 3)
      .map((item: unknown) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const record = item as Record<string, unknown>;
        const name = typeof record['name'] === 'string' ? record['name'].trim() : '';
        const code2 = typeof record['code2'] === 'string' ? record['code2'].trim().toUpperCase() : '';
        if (!name) {
          return null;
        }
        return {
          name,
          code2,
          flag: this.toFlagEmoji(code2)
        };
      })
      .filter((country): country is { name: string; code2: string; flag: string } => !!country);

    return topCountries.length ? topCountries : null;
  }

  getAudienceSportFitPercentage(track: any): number | null {
    const candidates: unknown[] = [
      track?.chartmetric_instagram_sports_fit_percent,
      track?.audience_sport_fit_percentage,
      track?.audience_sport_fit_percent,
      track?.audience_sport_fit,
      track?.sport_fit_percentage,
      track?.sport_fit_percent,
      track?.sport_fit,
      track?.sports_fit_percentage,
      track?.sports_fit_percent,
      track?.sports_fit
    ];

    for (const value of candidates) {
      const normalized = typeof value === 'string' ? value.replace('%', '').trim() : value;
      const n = Number(normalized);
      if (Number.isFinite(n)) {
        return Math.max(0, Math.min(100, Number(n.toFixed(1))));
      }
    }
    return null;
  }

  getSportFitIconPath(track: any): string {
    const percentage = this.getAudienceSportFitPercentage(track);
    if (percentage === null) {
      return 'assets/images/icons/volleyball.svg';
    }
    if (percentage <= 33) {
      return 'assets/images/icons/range/volleyball-l.svg';
    }
    if (percentage <= 66) {
      return 'assets/images/icons/range/volleyball-m.svg';
    }
    return 'assets/images/icons/range/volleyball-h.svg';
  }

  getTrackViralityPercentage(track: any): number | null {
    const candidates: unknown[] = [
      track?.track_virality,
      track?.track_virality_percent,
      track?.virality,
      track?.virality_percent
    ];

    for (const value of candidates) {
      const normalized = typeof value === 'string' ? value.replace('%', '').trim() : value;
      const n = Number(normalized);
      if (Number.isFinite(n)) {
        return Math.max(0, Math.min(100, Number(n.toFixed(1))));
      }
    }
    return null;
  }

  getTrackViralityIconPath(track: any): string {
    const percentage = this.getTrackViralityPercentage(track);
    if (percentage === null) {
      return 'assets/images/icons/range/gauge-m.svg';
    }
    if (percentage <= 33) {
      return 'assets/images/icons/range/gauge-l.svg';
    }
    if (percentage <= 66) {
      return 'assets/images/icons/range/gauge-m.svg';
    }
    return 'assets/images/icons/range/gauge-h.svg';
  }

  toFlagEmoji(code2: string | null | undefined): string {
    if (!code2 || code2.length !== 2) {
      return '';
    }
    const code = code2.toUpperCase();
    const first = code.charCodeAt(0);
    const second = code.charCodeAt(1);
    const isAtoZ = (value: number) => value >= 65 && value <= 90;
    if (!isAtoZ(first) || !isAtoZ(second)) {
      return '';
    }
    const OFFSET = 0x1f1e6 - 65;
    return String.fromCodePoint(first + OFFSET, second + OFFSET);
  }

  getTrackKey(track: any, _index: number): string {
    return this.getResultStableKey(track);
  }

  togglePanel(track: any, index: number): void {
    const key = this.getTrackKey(track, index);
    if (this.openedPanels.has(key)) {
      this.openedPanels.delete(key);
      return;
    }
    this.openedPanels.add(key);
  }

  isPanelOpen(track: any, index: number): boolean {
    return this.openedPanels.has(this.getTrackKey(track, index));
  }

  getTrackAudioUrl(track: any): string | null {
    const source = track?.file_wav ?? this.globalFileWav;
    return typeof source === 'string' && source.length > 0 ? source : null;
  }

  getTrackWaveformUrl(track: any): string | null {
    const source = track?.waveform ?? track?.waveform_url;
    return typeof source === 'string' && source.length > 0 ? source : null;
  }

  getWaveformError(track: any, index: number): string | null {
    return this.waveformErrors.get(this.getTrackKey(track, index)) ?? null;
  }

  isWaveformLoading(track: any, index: number): boolean {
    const key = this.getTrackKey(track, index);
    if (!key) {
      return false;
    }
    if (this.waveformErrors.has(key)) {
      return false;
    }
    return this.waveformLoading.has(key);
  }

  isTrackPlaying(track: any, index: number): boolean {
    return this.playingTrackKeys.has(this.getTrackKey(track, index));
  }

private currentAudioElement: HTMLAudioElement | null = null;
private currentTrackKey: string | null = null;

toggleTrackPlayback(track: any, index: number): void { 
  const key = this.getTrackKey(track, index); 
  const audioElement = this.audioRefs?.find(ref => ref.nativeElement.dataset['trackKey'] === key)?.nativeElement; 
  
  if (!audioElement) { return; }

  // SI SE REPRODUCE UNA CANCIÓN DISTINTA: Pausamos la que estaba sonando antes
  if (this.currentAudioElement && this.currentAudioElement !== audioElement) {
    this.currentAudioElement.pause(); // Esto disparará automáticamente 'onTrackAudioPause' de la canción anterior
  }

  // Lógica normal de toggle (reproducir/pausar)
  if (audioElement.paused) {
    audioElement.play();
  } else {
    audioElement.pause();
  }
}

onTrackAudioPlay(track: any, index: number, event: Event): void { 
  const key = this.getTrackKey(track, index); 
  const audio = event.target as HTMLAudioElement | null; 
  
  if (audio) { 
    // Guardamos la referencia de la canción que empieza a sonar ahora
    this.currentAudioElement = audio;
    this.currentTrackKey = key;

    // Si manejabas un Set de llaves reproduciéndose, lo ideal es limpiarlo para que solo tenga una
    this.playingTrackKeys.clear(); 
    this.playingTrackKeys.add(key); 
    
    this.startTimerLoop(key, audio); 
  } 
} 

onTrackAudioPause(track: any, index: number): void { 
  const key = this.getTrackKey(track, index); 
  this.playingTrackKeys.delete(key); 
  this.stopTimerLoop(key); 

  // Si la canción que se pausó es la actual, limpiamos las referencias
  if (this.currentTrackKey === key) {
    this.currentAudioElement = null;
    this.currentTrackKey = null;
  }
}

  onTrackAudioTimeUpdate(track: any, index: number, event: Event): void {
    const audio = event.target as HTMLAudioElement | null;
    if (!audio) {
      return;
    }
    this.trackTimes.set(this.getTrackKey(track, index), {
      current: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      duration: Number.isFinite(audio.duration) ? audio.duration : 0
    });
  }

  getTrackTimerLabel(track: any, index: number): string {
    const key = this.getTrackKey(track, index);
    const time = this.trackTimes.get(key);
    const current = time?.current ?? 0;
    const duration = time?.duration ?? 0;
    return `${this.formatMmSs(current)} `;
  }
  onSearch() {
    if (this.searchQuery) {
      this.searchInput.emit(this.searchQuery);
      this.showDropdown = false;
    }
  }

  private formatMmSs(totalSeconds: number): string {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
      return '00:00';
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  onTrackAudioMeta(track: any, index: number, event: Event): void {
    const audio = event.target as HTMLAudioElement | null;
    if (!audio) {
      return;
    }
    const key = this.getTrackKey(track, index);
    this.trackTimes.set(key, {
      current: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      duration: Number.isFinite(audio.duration) ? audio.duration : 0
    });
  }

  private startTimerLoop(key: string, audio: HTMLAudioElement): void {
    this.stopTimerLoop(key);
    const tick = () => {
      this.trackTimes.set(key, {
        current: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0
      });
      if (!audio.paused && !audio.ended) {
        const rafId = requestAnimationFrame(tick);
        this.timerRafIds.set(key, rafId);
      }
    };
    const rafId = requestAnimationFrame(tick);
    this.timerRafIds.set(key, rafId);
  }

  private stopTimerLoop(key: string): void {
    const rafId = this.timerRafIds.get(key);
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      this.timerRafIds.delete(key);
    }
  }

  private async initializePeaksForVisibleRows(): Promise<void> {
    const visible = this.seedTrack ? [this.seedTrack, ...this.results] : this.results;
    if (!visible.length) {
      return;
    }

    const Peaks = await this.getPeaksLib();

    visible.forEach((track, index) => {
      const key = this.getTrackKey(track, index);
      if (this.peaksInstances.has(key)) {
        return;
      }

      const audioUrl = this.getTrackAudioUrl(track);
      const waveformUrl = this.getTrackWaveformUrl(track);
      if (!audioUrl || !waveformUrl) {
        return;
      }

      const audioElement = this.audioRefs?.find(ref => ref.nativeElement.dataset['trackKey'] === key)?.nativeElement;
      const overviewElement = this.waveOverviewRefs?.find(ref => ref.nativeElement.dataset['trackKey'] === key)?.nativeElement;
      if (!audioElement || !overviewElement) {
        return;
      }

      this.waveformLoading.add(key);
      Peaks.init({
        overview: {
          container: overviewElement,
          waveformColor: '#ffffff',
          showAxisLabels: false
        },
        waveformColor: '#ffffff',
        playheadColor: '#023185',
        mediaElement: audioElement,
        dataUri: {
          json: waveformUrl
        },
        showPlayheadTime: false,
        keyboard: false
      }, (err: unknown, peaksInstance: any) => {
        this.waveformLoading.delete(key);
        if (err || !peaksInstance) {
          const message = err && typeof err === 'object' && 'message' in err
            ? String((err as { message?: unknown }).message ?? 'Failed to load waveform')
            : 'Failed to load waveform';
          this.waveformErrors.set(key, message);
          return;
        }
        this.waveformErrors.delete(key);
        this.peaksInstances.set(key, peaksInstance);
        this.applyHighlightsToPeaks(peaksInstance, track);
      });
    });
  }

  private applyHighlightsToPeaks(peaksInstance: any, track: any): void {
    const highlights = this.getTrackHighlights(track);
    if (!highlights.length || !peaksInstance?.segments?.add) {
      return;
    }

    try {
      peaksInstance.segments.removeAll?.();
      peaksInstance.segments.add(
        highlights.map((item, index) => ({
          id: `highlight-${index}`,
          startTime: item.offset,
          endTime: item.offset + item.duration,
          labelText: `H${index + 1}`,
          color: 'rgba(2, 49, 133, 0.35)',
          editable: false
        }))
      );
    } catch {
      // no-op
    }
  }

  private getTrackHighlights(track: any): Array<{ offset: number; duration: number }> {
    const source = Array.isArray(track?.highlights) && track.highlights.length
      ? track.highlights
      : this.dummyHighlights;

    return source
      .map((item: unknown) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const record = item as Record<string, unknown>;
        const offset = Number(record['offset']);
        const duration = Number(record['duration']);
        if (!Number.isFinite(offset) || !Number.isFinite(duration) || offset < 0 || duration <= 0) {
          return null;
        }
        return { offset, duration };
      })
      .filter((item: { offset: number; duration: number } | null): item is { offset: number; duration: number } => !!item);
  }

  private async getPeaksLib(): Promise<any> {
    if (this.peaksLib) {
      return this.peaksLib;
    }
    const module = await import('peaks.js');
    this.peaksLib = module.default ?? module;
    return this.peaksLib;
  }

  setQuery(query: string) {
    this.searchQuery = query;
    this.searchControl.setValue(query);
    this.showDropdown = false;
  }

  private destroyAllPeaks(): void {
    this.peaksInstances.forEach((instance) => {
      try {
        instance?.destroy?.();
      } catch {
        // no-op
      }
    });
    this.peaksInstances.clear();
    this.waveformLoading.clear();
    this.playingTrackKeys.clear();
    this.openedPanels.clear();
    this.trackTimes.clear();
    this.timerRafIds.forEach((rafId) => cancelAnimationFrame(rafId));
    this.timerRafIds.clear();
    if (this.peaksInitTimerId !== null) {
      clearTimeout(this.peaksInitTimerId);
      this.peaksInitTimerId = null;
    }
  }

  private isSupportedMediaUrl(inputUrl: string): boolean {
    let url = inputUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      const path = parsed.pathname;

      if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'youtu.be' || host.endsWith('.youtube.com')) {
        return true;
      }

      if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'vimeopro.com' || host === 'www.vimeopro.com') {
        return true;
      }

      if (host === 'i.vimeocdn.com' && path.startsWith('/video/')) {
        return true;
      }

      if (host === 'soundcloud.com' || host === 'www.soundcloud.com') {
        return true;
      }

      if (host === 'w.soundcloud.com' && path.startsWith('/player/')) {
        return true;
      }

      if (host === 'api.soundcloud.com' && path.startsWith('/tracks/')) {
        return true;
      }

      if (host === 'open.spotify.com' && (path.startsWith('/track/') || path.startsWith('/embed/track/'))) {
        return true;
      }

      if (host === 'music.apple.com') {
        return true;
      }

      if ((host === 'tiktok.com' || host === 'www.tiktok.com') && /\/@[^/]+\/video\/\d+/.test(path)) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}
