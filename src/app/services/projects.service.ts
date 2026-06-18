import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';
import { IFavoriteResult, ILicenseResult, IProjectResult } from '../interfaces/response/projects.response';

/**
 * Projects / Favorites / Licenses ("my-club") service.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * BACKEND CONTRACT — endpoints the backend dev must implement (base: `{API_URL}/{VERSION}/my-club`)
 * ──────────────────────────────────────────────────────────────────────────
 * Favorites (liked tracks)
 *   GET  /favorites/                      -> IFavoriteResult[] (or { results: IFavoriteResult[] })
 *   POST /favorites/toggle/  body: { track_uuid }  -> toggles like; returns the favorite or 204
 *
 * Projects (collections of favorites)
 *   GET  /projects/                       -> IProjectResult[] (or { results })
 *   POST /projects/          body: { name, description? }            -> IProjectResult
 *   POST /projects/{uuid}/add-track/      body: { track_favorite_uuid }
 *   POST /projects/{uuid}/remove-track/   body: { track_favorite_uuid }
 *
 * Licenses
 *   GET  /licenses/                       -> ILicenseResult[] (or { results })
 *   POST /licenses/          body: { track, extended_commercial_use } -> ILicenseResult
 *   GET  /licenses/{uuid}/pdf/            -> application/pdf (rendered from the HTML template)
 *
 * Response shapes are defined in `interfaces/response/projects.response.ts`.
 *
 * STATE / PERSISTENCE
 * - `favorites$` and `licensedTracks$` are the UI sources of truth (optimistic
 *   updates for snappy UX, reconciled against the backend via `loadFavorites()` /
 *   `loadLicenses()`).
 * - Nothing is persisted client-side (no localStorage). State is in-memory only,
 *   so every reload starts clean and the backend is the single source of truth.
 *   In local dev (no backend) a failed write is kept so the UI stays testable
 *   within the session; in production a failed write is rolled back. See `keepOnError`.
 */
@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.API_URL}/${environment.VERSION}/my-club`;

  /**
   * In local dev there is no backend, so a failed write is kept (not rolled back)
   * to keep the UI testable within the session. State is in-memory only — nothing
   * is persisted client-side, so every reload starts clean.
   */
  private readonly keepOnError = !environment.production;

  private favoritesSubject = new BehaviorSubject<IFavoriteResult[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  private licensedTracksSubject = new BehaviorSubject<any[]>([]);
  licensedTracks$ = this.licensedTracksSubject.asObservable();

  constructor() {
    // One-time cleanup: drop any favorites left in localStorage by older builds.
    // We no longer persist anything client-side.
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('acrylic_favorites'))
        .forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore (storage unavailable)
    }
  }

  /* ──────────────────────────── Favorites ──────────────────────────── */

  loadFavorites(): void {
    this.http.get<ICommonSuccessResponse<IFavoriteResult[]>>(`${this.base}/favorites/`).pipe(
      catchError((err) => {
        console.warn('[ProjectsService] loadFavorites unavailable', err);
        return of(null);
      })
    ).subscribe((res) => {
      if (!res) { return; }
      const backend: IFavoriteResult[] = Array.isArray(res) ? (res as any) : ((res as any).results ?? []);
      // Backend is authoritative; keep any optimistic entries still in flight.
      this.setFavorites(this.mergeFavorites(backend, this.favoritesSubject.getValue()));
    });
  }

  /**
   * Like / unlike a track. Optimistic, then POST. The backend stays the source
   * of truth (`loadFavorites()` reconciles on success); on failure the optimistic
   * change is rolled back in production (and kept in local dev for testing).
   */
  toggleFavorite(trackId: string | number, trackSnapshot?: any): Observable<any> {
    const previous = this.favoritesSubject.getValue();
    // One canonical key per song so it can never be stored more than once.
    const key = (trackSnapshot ? this.trackKey(trackSnapshot) : '') || String(trackId);
    const existingIdx = previous.findIndex(f => this.trackKey(f) === key);

    if (existingIdx >= 0) {
      this.setFavorites(previous.filter((_, i) => i !== existingIdx));
    } else {
      const snap = trackSnapshot ?? {};
      const numericId = Number(snap.track_id ?? snap.id);
      const tempFav: IFavoriteResult = {
        uuid: `temp-${key}`,
        track_id: Number.isFinite(numericId) ? numericId : undefined,
        track_uuid: key,
        isrc: snap.isrc ?? '',
        track_name: snap.track_name ?? snap.name ?? '',
        artist_name: snap.artist_canonical ?? snap.artist_name ?? '',
        cover_image: snap.cover_image ?? snap.image_url ?? '',
        created: new Date().toISOString(),
        track: trackSnapshot ?? undefined,
      };
      this.setFavorites([tempFav, ...previous]);
    }

    return this.http.post<any>(`${this.base}/favorites/toggle/`, { track_uuid: key }).pipe(
      tap(() => this.loadFavorites()),
      catchError((err) => {
        if (this.keepOnError) {
          // Local dev without a backend: keep the optimistic state so it's testable
          // within the session (in-memory; cleared on reload).
          console.warn('[ProjectsService] toggleFavorite backend unavailable (local) — keeping optimistic state', err);
          return of(null);
        }
        // Production: revert to stay consistent with the server.
        this.setFavorites(previous);
        return throwError(() => err);
      })
    );
  }

  getFavorites(): Observable<ICommonSuccessResponse<IFavoriteResult[]>> {
    return this.http.get<ICommonSuccessResponse<IFavoriteResult[]>>(`${this.base}/favorites/`);
  }

  /* ──────────────────────────── Projects ──────────────────────────── */

  getProjects(): Observable<ICommonSuccessResponse<IProjectResult[]>> {
    return this.http.get<ICommonSuccessResponse<IProjectResult[]>>(`${this.base}/projects/`);
  }

  createProject(name: string, description?: string): Observable<IProjectResult> {
    return this.http.post<IProjectResult>(`${this.base}/projects/`, { name, description });
  }

  addTrackToProject(projectUuid: string, favoriteUuid: string): Observable<any> {
    return this.http.post<any>(`${this.base}/projects/${projectUuid}/add-track/`, { track_favorite_uuid: favoriteUuid });
  }

  removeTrackFromProject(projectUuid: string, favoriteUuid: string): Observable<any> {
    return this.http.post<any>(`${this.base}/projects/${projectUuid}/remove-track/`, { track_favorite_uuid: favoriteUuid });
  }

  /* ──────────────────────────── Licenses ──────────────────────────── */

  loadLicenses(): void {
    this.http.get<ICommonSuccessResponse<ILicenseResult[]>>(`${this.base}/licenses/`).pipe(
      catchError(() => of(null))
    ).subscribe((res) => {
      if (!res) { return; }
      const backendLicenses: ILicenseResult[] = Array.isArray(res) ? (res as any) : ((res as any).results ?? []);
      const current = this.licensedTracksSubject.getValue();
      const backendKeys = new Set(backendLicenses.map(l => this.trackKey(l)));
      const optimisticOnly = current.filter((t: any) => !backendKeys.has(this.trackKey(t)));
      this.licensedTracksSubject.next([...backendLicenses, ...optimisticOnly]);
    });
  }

  /** Optimistic, in-memory licensed mark (reconciled by `loadLicenses()`). */
  addLicensedTrack(track: any): void {
    const current = this.licensedTracksSubject.getValue();
    const key = this.trackKey(track);
    if (!current.some(t => this.trackKey(t) === key)) {
      this.licensedTracksSubject.next([track, ...current]);
    }
  }

  createLicense(trackUuid: string, extendedCommercialUse = false): Observable<ILicenseResult> {
    return this.http.post<ILicenseResult>(`${this.base}/licenses/`, {
      track: trackUuid,
      extended_commercial_use: extendedCommercialUse,
    });
  }

  getLicenses(): Observable<ICommonSuccessResponse<ILicenseResult[]>> {
    return this.http.get<ICommonSuccessResponse<ILicenseResult[]>>(`${this.base}/licenses/`);
  }

  /** License PDF, rendered server-side from the HTML template. */
  downloadLicensePdf(licenseUuid: string): Observable<Blob> {
    return this.http.get(`${this.base}/licenses/${licenseUuid}/pdf/`, { responseType: 'blob' });
  }

  /* ──────────────────────────── Helpers ──────────────────────────── */

  /**
   * Canonical identity for a track/favorite/license, shared by every component
   * so the same song always resolves to ONE key — and crucially the SAME key the
   * backend stores in `track_uuid`.
   *
   * The catalog UUID is the source of truth: backend rows expose it as
   * `track_uuid`; AIMS search results expose it as `uuid`. We prefer those, then
   * the numeric catalog id (`track_id`/`id`), then `isrc`/`spotify_id`, then
   * `name::artist`. Synthetic `temp-` ids (optimistic rows) are skipped.
   */
  trackKey(f: any): string {
    const candidates = [f?.track_uuid, f?.uuid, f?.track_id, f?.id, f?.isrc, f?.spotify_id];
    for (const c of candidates) {
      if (c !== null && c !== undefined) {
        const s = String(c).trim();
        if (s.length && !s.startsWith('temp-')) { return s; }
      }
    }
    // Only recurse into an embedded full-track OBJECT (backend `track` is a uuid string).
    if (f?.track && typeof f.track === 'object') {
      const nested = this.trackKey(f.track);
      if (nested) { return nested; }
    }
    const name = (f?.track_name ?? f?.track_name_track ?? f?.name ?? '').toString().trim();
    const artist = (f?.artist_canonical ?? f?.artist ?? f?.artist_name ?? '').toString().trim();
    return `${name}::${artist}`.toLowerCase();
  }

  /** Union by canonical key; entries from `primary` win order/precedence. When a
   *  later duplicate carries the full track OBJECT (e.g. optimistic snapshot) but
   *  the kept entry only has the uuid string, attach it so the rich row still renders. */
  private mergeFavorites(primary: IFavoriteResult[], secondary: IFavoriteResult[]): IFavoriteResult[] {
    const byKey = new Map<string, IFavoriteResult>();
    const order: string[] = [];
    for (const f of [...primary, ...secondary]) {
      const key = this.trackKey(f);
      if (!key) { continue; }
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, f);
        order.push(key);
      } else if (typeof existing.track !== 'object' && f.track && typeof f.track === 'object') {
        byKey.set(key, { ...existing, track: f.track });
      }
    }
    return order.map(k => byKey.get(k)!);
  }

  /** Emits favorites, always de-duped by canonical key so the same song can
   *  never appear twice regardless of how it entered the list. In-memory only. */
  private setFavorites(favs: IFavoriteResult[]): void {
    this.favoritesSubject.next(this.mergeFavorites(favs, []));
  }
}
