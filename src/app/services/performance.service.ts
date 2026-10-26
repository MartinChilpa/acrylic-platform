import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { SKIP_ERROR_ALERT } from '../interceptors/error.interceptor';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';
import {
  IPerformanceArtistResult,
  IPerformancePriceResult,
  IPerformanceTrackResult,
  PerformanceArtist,
  PerformanceCatalog,
  PerformancePlatform,
  PerformanceTrack,
} from '../interfaces/response/performance.response';
import { PERFORMANCE_PLATFORMS } from '../utils/performance.utils';
import { SpotifyService } from './spotify.service';

/**
 * Data for the Performance tab: every track in catalog_track joined with its
 * artist's platform audience and its price tier.
 *
 * TODO(backend): replace the three-request join below with one endpoint that
 * searches, filters, sorts and paginates server-side and returns the fields of
 * PerformanceTrack (including per-track spotify_streams and a preview url).
 * Only this service needs to change; the components read PerformanceTrack.
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private http = inject(HttpClient);
  private spotifyService = inject(SpotifyService);
  private readonly base = `${environment.API_URL}/${environment.VERSION}`;
  private static readonly PAGE_SIZE = 100;

  private artists$?: Observable<Map<string, PerformanceArtist>>;
  private tiers$?: Observable<Map<string, string>>;

  /* ─────────── Catalog ─────────── */

  private catalog$?: Observable<PerformanceCatalog>;

  /**
   * Every track in catalog_track with its artist, loaded once per session.
   * Search runs over this in the browser (see performance-search.utils), since
   * geographic, platform and approximate matching need the artist fields that
   * /tracks/?search= cannot filter on.
   */
  loadCatalog(): Observable<PerformanceCatalog> {
    if (!this.catalog$) {
      const params = new HttpParams().set('page_size', PerformanceService.PAGE_SIZE);
      this.catalog$ = forkJoin({
        tracks: this.fetchAll<IPerformanceTrackResult>(`${this.base}/tracks/`, params),
        artists: this.loadArtists(),
        tiers: this.loadTiers(),
      }).pipe(
        map(({ tracks, artists, tiers }) => ({
          tracks: tracks.map(t => this.toTrack(t, artists, tiers)),
          updated: this.latestUpdate(artists),
        })),
        catchError(err => { this.catalog$ = undefined; return throwError(() => err); }),
        shareReplay(1)
      );
    }
    return this.catalog$;
  }

  getTrack(uuid: string): Observable<PerformanceTrack> {
    return forkJoin({
      track: this.http.get<IPerformanceTrackResult>(`${this.base}/tracks/${uuid}/`),
      artists: this.loadArtists(),
      tiers: this.loadTiers(),
    }).pipe(map(({ track, artists, tiers }) => this.toTrack(track, artists, tiers)));
  }

  /** The artist's other tracks, for "More from …". */
  getArtistTracks(artistUuid: string): Observable<PerformanceTrack[]> {
    const params = new HttpParams().set('page_size', PerformanceService.PAGE_SIZE);
    return forkJoin({
      tracks: this.fetchAll<IPerformanceTrackResult>(`${this.base}/artists/${artistUuid}/tracks/`, params),
      artists: this.loadArtists(),
      tiers: this.loadTiers(),
    }).pipe(map(({ tracks, artists, tiers }) => tracks.map(t => this.toTrack(t, artists, tiers))));
  }

  /**
   * The Spotify URL the dashboard search takes as a seed, which is where the
   * existing license flow lives. Resolved from the ISRC.
   */
  getSpotifyUrl(track: PerformanceTrack): Observable<string | null> {
    if (!track.isrc) { return of(null); }
    return this.spotifyService.getTrack(track.isrc).pipe(map(res => res?.spotify_url || null));
  }

  /** Reads the first page, then requests the remaining pages in parallel. */
  private fetchAll<T>(url: string, params: HttpParams, context?: HttpContext): Observable<T[]> {
    const pageSize = Number(params.get('page_size')) || PerformanceService.PAGE_SIZE;
    return this.http.get<ICommonSuccessResponse<T[]>>(url, { params, context }).pipe(
      switchMap(first => {
        const pages = Math.ceil((first.count ?? 0) / pageSize);
        if (pages <= 1) { return of(first.results ?? []); }
        const rest = Array.from({ length: pages - 1 }, (_, i) =>
          this.http.get<ICommonSuccessResponse<T[]>>(url, { params: params.set('page', i + 2), context }));
        return forkJoin(rest).pipe(
          map(responses => responses.reduce((all, res) => all.concat(res.results ?? []), first.results ?? []))
        );
      })
    );
  }

  private loadArtists(): Observable<Map<string, PerformanceArtist>> {
    if (!this.artists$) {
      const params = new HttpParams().set('page_size', PerformanceService.PAGE_SIZE);
      this.artists$ = this.fetchAll<IPerformanceArtistResult>(`${this.base}/artists/`, params).pipe(
        map(rows => new Map(rows.map(row => [row.uuid, this.toArtist(row)]))),
        // A failed load must not stay cached; the next search retries it.
        catchError(err => { this.artists$ = undefined; return throwError(() => err); }),
        shareReplay(1)
      );
    }
    return this.artists$;
  }

  /** Price uuid -> tier name ("PreClear", "Basic", …). */
  private loadTiers(): Observable<Map<string, string>> {
    if (!this.tiers$) {
      const params = new HttpParams().set('page_size', PerformanceService.PAGE_SIZE);
      // Optional data: a failure here falls back quietly, without the global alert.
      const silent = new HttpContext().set(SKIP_ERROR_ALERT, true);
      this.tiers$ = this.fetchAll<IPerformancePriceResult>(`${this.base}/prices/`, params, silent).pipe(
        map(rows => new Map(rows.map(row => [row.uuid, row.name]))),
        // Tiers only label rows; without them every track reads as Artist Promo
        // rather than the whole catalog failing. Not cached, so it is retried.
        catchError(err => {
          console.error('[Performance] prices load failed', err);
          this.tiers$ = undefined;
          return of(new Map<string, string>());
        }),
        shareReplay(1)
      );
    }
    return this.tiers$;
  }

  private toArtist(row: IPerformanceArtistResult): PerformanceArtist {
    const count = (value: number | null) => (value && value > 0 ? value : null);
    const audience: Record<PerformancePlatform, number | null> = {
      tiktok: count(row.tiktok_followers),
      instagram: count(row.instagram_followers),
      youtube: count(row.youtube_followers),
      spotify: count(row.spotify_followers),
    };
    const known = PERFORMANCE_PLATFORMS.filter(p => audience[p.key] !== null);
    const largest = known.reduce<PerformancePlatform | null>(
      (best, p) => (best === null || (audience[p.key] ?? 0) > (audience[best] ?? 0) ? p.key : best), null);

    return {
      uuid: row.uuid,
      name: row.name,
      countryCode: row.country || null,
      hometown: (row.hometown ?? '').trim() || null,
      instagramTopCountries: this.readJsonList(row.chartmetric_instagram_top_countries)
        .filter(c => c?.code2)
        .map(c => ({ code: String(c.code2).toUpperCase(), rank: Number(c.rank) || 999, weight: this.toNumber(c.weights) })),
      instagramTopCities: this.readJsonList(row.chartmetric_instagram_top_cities)
        .filter(c => c?.city_name)
        .map(c => ({
          name: String(c.city_name),
          code: c.code2 ? String(c.code2).toUpperCase() : null,
          rank: Number(c.rank) || 999,
          weight: this.toNumber(c.weights),
        })),
      audience,
      totalAudience: known.length ? known.reduce((sum, p) => sum + (audience[p.key] ?? 0), 0) : null,
      largestPlatform: largest,
      profileUrls: {
        tiktok: row.tiktok_url || null,
        instagram: row.instagram_url || null,
        youtube: row.youtube_url || null,
        spotify: row.spotify_url || null,
      },
      updated: row.updated ? new Date(row.updated) : null,
    };
  }

  private toTrack(row: IPerformanceTrackResult, artists: Map<string, PerformanceArtist>, tiers: Map<string, string>): PerformanceTrack {
    const tierName = row.price ? tiers.get(row.price) ?? '' : '';
    return {
      uuid: row.uuid,
      isrc: row.isrc,
      name: row.name,
      artistUuid: row.artist,
      artist: artists.get(row.artist) ?? null,
      tier: /preclear/i.test(tierName) ? 'PreClear' : 'Artist Promo',
      extendedCommercialUse: !!row.extended_commercial_use,
      spotifyStreams: row.spotify_streams ?? null,
      previewUrl: this.toMediaUrl(row.preview_url ?? row.audio_url),
      coverUrl: this.toImageUrl(row.cover_image),
    };
  }

  /** Chartmetric JSON columns arrive parsed, but tolerate a JSON string too. */
  private readJsonList<T>(value: T[] | string | null | undefined): T[] {
    if (Array.isArray(value)) { return value; }
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private toNumber(value: unknown): number | null {
    const n = Number(value);
    return value === null || value === undefined || !Number.isFinite(n) ? null : n;
  }

  /**
   * Audio must come as a full http(s) URL (a signed media link). A bare storage
   * key such as "tracks/…/x.wav" is ignored, never turned into a request.
   */
  private toMediaUrl(value: string | null | undefined): string | null {
    const url = (value ?? '').trim();
    return /^https?:\/\//i.test(url) ? url : null;
  }

  /** Only absolute http(s) or site-relative image URLs are used. */
  private toImageUrl(value: string | null | undefined): string | null {
    const url = (value ?? '').trim();
    return /^(https?:)?\/\//i.test(url) || url.startsWith('/') ? url : null;
  }

  private latestUpdate(artists: Map<string, PerformanceArtist>): Date | null {
    let latest: Date | null = null;
    artists.forEach(a => {
      if (a.updated && (!latest || a.updated > latest)) { latest = a.updated; }
    });
    return latest;
  }

  /* ─────────── Preview playback (one track at a time, shared by list and details) ─────────── */

  readonly playingUuid = signal<string | null>(null);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  /** Tracks whose preview could not be played, even after refreshing the link. */
  readonly failedPreviews = signal<ReadonlySet<string>>(new Set());
  private audio: HTMLAudioElement | null = null;
  private audioUuid: string | null = null;

  canPreview(track: PerformanceTrack | null): boolean {
    return !!track?.previewUrl && !this.failedPreviews().has(track.uuid);
  }

  /** Play/pause; one preview at a time. Audio only, nothing else is drawn. */
  togglePreview(track: PerformanceTrack): void {
    if (!this.canPreview(track)) { return; }
    if (this.audioUuid !== track.uuid || !this.audio) {
      this.startPreview(track, track.previewUrl!, true);
      return;
    }
    if (this.audio.paused) { this.play(this.audio); } else { this.audio.pause(); }
  }

  stopPreview(): void {
    this.audio?.pause();
    this.audio = null;
    this.audioUuid = null;
    this.playingUuid.set(null);
    this.currentTime.set(0);
    this.duration.set(0);
  }

  private startPreview(track: PerformanceTrack, url: string, mayRefresh: boolean): void {
    this.stopPreview();
    const audio = new Audio(url);
    this.audio = audio;
    this.audioUuid = track.uuid;
    // Listeners ignore an element that has since been replaced.
    const current = () => this.audio === audio;
    audio.addEventListener('timeupdate', () => {
      if (!current()) { return; }
      this.currentTime.set(audio.currentTime);
      this.duration.set(audio.duration || 0);
    });
    audio.addEventListener('play', () => { if (current()) { this.playingUuid.set(track.uuid); } });
    audio.addEventListener('pause', () => { if (current()) { this.playingUuid.set(null); } });
    audio.addEventListener('ended', () => { if (current()) { this.playingUuid.set(null); } });
    audio.addEventListener('error', () => {
      if (!current()) { return; }
      this.stopPreview();
      // Signed links expire; fetch the track once for a fresh one before giving up.
      if (mayRefresh) { this.refreshPreview(track); } else { this.markFailed(track); }
    });
    this.play(audio);
  }

  /** play() rejects on autoplay blocks and bad sources; the 'error' event covers the latter. */
  private play(audio: HTMLAudioElement): void {
    audio.play().catch(err => {
      if (err?.name === 'NotAllowedError' && this.audio === audio) { this.playingUuid.set(null); }
    });
  }

  private refreshPreview(track: PerformanceTrack): void {
    this.http.get<IPerformanceTrackResult>(`${this.base}/tracks/${track.uuid}/`).pipe(
      map(row => this.toMediaUrl(row.preview_url ?? row.audio_url)),
      catchError(() => of(null))
    ).subscribe(url => {
      if (!url || url === track.previewUrl) { this.markFailed(track); return; }
      track.previewUrl = url;
      this.startPreview(track, url, false);
    });
  }

  private markFailed(track: PerformanceTrack): void {
    const next = new Set(this.failedPreviews());
    next.add(track.uuid);
    this.failedPreviews.set(next);
  }
}
