import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  /** Tracks matching `search` (track name, artist name or ISRC), searched in the DB. */
  searchCatalog(search: string): Observable<PerformanceCatalog> {
    let params = new HttpParams().set('page_size', PerformanceService.PAGE_SIZE);
    const q = search.trim();
    if (q) { params = params.set('search', q); }

    return forkJoin({
      tracks: this.fetchAll<IPerformanceTrackResult>(`${this.base}/tracks/`, params),
      artists: this.loadArtists(),
      tiers: this.loadTiers(),
    }).pipe(
      map(({ tracks, artists, tiers }) => ({
        tracks: tracks.map(t => this.toTrack(t, artists, tiers)),
        updated: this.latestUpdate(artists),
      }))
    );
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
  private fetchAll<T>(url: string, params: HttpParams): Observable<T[]> {
    const pageSize = Number(params.get('page_size')) || PerformanceService.PAGE_SIZE;
    return this.http.get<ICommonSuccessResponse<T[]>>(url, { params }).pipe(
      switchMap(first => {
        const pages = Math.ceil((first.count ?? 0) / pageSize);
        if (pages <= 1) { return of(first.results ?? []); }
        const rest = Array.from({ length: pages - 1 }, (_, i) =>
          this.http.get<ICommonSuccessResponse<T[]>>(url, { params: params.set('page', i + 2) }));
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
      this.tiers$ = this.fetchAll<IPerformancePriceResult>(`${this.base}/prices/`, params).pipe(
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
      previewUrl: row.audio_url || null,
    };
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
  private audio: HTMLAudioElement | null = null;
  private audioUuid: string | null = null;

  togglePreview(track: PerformanceTrack): void {
    if (!track.previewUrl) { return; }
    if (this.audioUuid !== track.uuid) {
      this.stopPreview();
      this.audio = new Audio(track.previewUrl);
      this.audioUuid = track.uuid;
      this.audio.addEventListener('timeupdate', () => {
        this.currentTime.set(this.audio?.currentTime ?? 0);
        this.duration.set(this.audio?.duration || 0);
      });
      this.audio.addEventListener('play', () => this.playingUuid.set(track.uuid));
      this.audio.addEventListener('pause', () => this.playingUuid.set(null));
      this.audio.addEventListener('ended', () => this.playingUuid.set(null));
    }
    if (this.audio!.paused) { this.audio!.play(); } else { this.audio!.pause(); }
  }

  stopPreview(): void {
    this.audio?.pause();
    this.audio = null;
    this.audioUuid = null;
    this.playingUuid.set(null);
    this.currentTime.set(0);
    this.duration.set(0);
  }
}
