import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, catchError, expand, forkJoin, map, of, reduce, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';
import { DestinationsMode, IFavoriteResult, IProjectResult, ITrackDestinations } from '../interfaces/response/projects.response';
import { SKIP_ERROR_ALERT } from '../interceptors/error.interceptor';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.API_URL}/${environment.VERSION}/my-club`;
  private readonly keepOnError = !environment.production;

  private favoritesSubject = new BehaviorSubject<IFavoriteResult[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  loadFavorites(): void {
    this.http.get<ICommonSuccessResponse<IFavoriteResult[]> | IFavoriteResult[]>(`${this.base}/favorites/`).pipe(
      expand((response) => {
        const nextUrl = this.getNextFavoritesPageUrl(response);
        return nextUrl
          ? this.http.get<ICommonSuccessResponse<IFavoriteResult[]> | IFavoriteResult[]>(nextUrl).pipe(
              catchError((err) => {
                // Keep the pages already received if a later backend page fails.
                console.warn('[ProjectsService] additional favorites page unavailable', err);
                return EMPTY;
              })
            )
          : EMPTY;
      }),
      reduce(
        (allFavorites, response) => [...allFavorites, ...this.getFavoritesFromResponse(response)],
        [] as IFavoriteResult[]
      ),
      catchError((err) => {
        console.warn('[ProjectsService] loadFavorites unavailable', err);
        return of(null);
      })
    ).subscribe((backend) => {
      if (!backend) { return; }
      this.setFavorites(backend);
    });
  }

  private getFavoritesFromResponse(
    response: ICommonSuccessResponse<IFavoriteResult[]> | IFavoriteResult[]
  ): IFavoriteResult[] {
    return Array.isArray(response) ? response : (response?.results ?? []);
  }

  private getNextFavoritesPageUrl(
    response: ICommonSuccessResponse<IFavoriteResult[]> | IFavoriteResult[]
  ): string | null {
    if (Array.isArray(response) || typeof response?.next !== 'string' || !response.next.trim()) {
      return null;
    }

    const next = response.next.trim();
    try {
      const parsed = new URL(next, window.location.origin);
      // Keep API pagination on the app's same-origin proxy even when DRF emits
      // an absolute platform URL.
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return next.startsWith('/') ? next : null;
    }
  }

  toggleFavorite(trackId: string | number, trackSnapshot?: any): Observable<any> {
    const previous = this.favoritesSubject.getValue();
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
          console.warn('[ProjectsService] toggleFavorite backend unavailable (local)', err);
          return of(null);
        }
        this.setFavorites(previous);
        return throwError(() => err);
      })
    );
  }

  /**
   * Like = save to Saved tracks, right away and optimistically (the heart is
   * filled before the request returns). Never unsaves; a no-op when saved.
   */
  addFavorite(trackUuid: string, trackSnapshot?: any): Observable<unknown> {
    const previous = this.favoritesSubject.getValue();
    if (!trackUuid || previous.some(f => this.trackKey(f) === trackUuid)) { return of(null); }

    const snap = trackSnapshot && typeof trackSnapshot === 'object' ? trackSnapshot : {};
    const numericId = Number(snap.track_id ?? snap.id);
    const tempFav: IFavoriteResult = {
      uuid: `temp-${trackUuid}`,
      track_id: Number.isFinite(numericId) ? numericId : undefined,
      track_uuid: trackUuid,
      isrc: snap.isrc ?? '',
      track_name: snap.track_name ?? snap.name ?? '',
      artist_name: snap.artist_canonical ?? snap.artist_name ?? snap.artist?.name ?? '',
      cover_image: snap.cover_image ?? snap.image_url ?? '',
      created: new Date().toISOString(),
      track: trackSnapshot ?? undefined,
    };
    this.setFavorites([tempFav, ...previous]);

    return this.http.post<ITrackDestinations>(`${this.base}/favorites/add/`, { track_uuid: trackUuid }, { context: this.quiet() }).pipe(
      tap(() => this.loadFavorites()),
      catchError(err => {
        this.setFavorites(previous);
        return throwError(() => err);
      }),
    );
  }

  getFavorites(): Observable<ICommonSuccessResponse<IFavoriteResult[]>> {
    return this.http.get<ICommonSuccessResponse<IFavoriteResult[]>>(`${this.base}/favorites/`);
  }

  getProjects(): Observable<ICommonSuccessResponse<IProjectResult[]>> {
    // The Projects page shows its own message when these fail.
    return this.http.get<ICommonSuccessResponse<IProjectResult[]>>(`${this.base}/projects/`, { context: this.quiet() });
  }

  // ─── Projects cache shared by the picker, Projects page and Home ─────

  private projectsSubject = new BehaviorSubject<IProjectResult[]>([]);
  projects$ = this.projectsSubject.asObservable();
  /** 'idle' until the first load; 'error' keeps the last list but lets pages say so. */
  projectsState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';

  get projects(): IProjectResult[] {
    return this.projectsSubject.getValue();
  }

  loadProjects(): void {
    this.projectsState = 'loading';
    this.getProjects().subscribe({
      next: (res) => {
        const list: IProjectResult[] = Array.isArray(res) ? (res as any) : (res?.results ?? []);
        this.projectsState = 'ready';
        this.setProjects(list.map(p => this.normalizeProject(p)));
      },
      error: () => { this.projectsState = 'error'; this.setProjects([...this.projects]); },
    });
  }

  createProject(name: string, description?: string): Observable<IProjectResult> {
    return this.http.post<IProjectResult>(`${this.base}/projects/`, { name, description: description ?? '' }, { context: this.quiet() }).pipe(
      tap(project => this.setProjects([this.normalizeProject(project), ...this.projects])),
    );
  }

  updateProject(uuid: string, changes: { name?: string; description?: string }): Observable<IProjectResult> {
    return this.http.patch<IProjectResult>(`${this.base}/projects/${uuid}/`, changes, { context: this.quiet() }).pipe(
      tap(project => this.replaceProject(project)),
    );
  }

  deleteProject(uuid: string): Observable<unknown> {
    return this.http.delete(`${this.base}/projects/${uuid}/`, { context: this.quiet() }).pipe(
      tap(() => this.setProjects(this.projects.filter(p => p.uuid !== uuid))),
    );
  }

  /** Adds one catalog track to a project. */
  addTrackToProject(projectUuid: string, trackUuid: string): Observable<unknown> {
    return this.http.post(`${this.base}/projects/${projectUuid}/tracks/`, { track_uuid: trackUuid }, { context: this.quiet() }).pipe(
      // The project list may omit the rich track payload, so refresh both the
      // project cache and the favorites cache that carries the audio/waveform
      // snapshot used by the row component.
      tap(() => {
        this.loadProjects();
        this.loadFavorites();
      }),
    );
  }

  removeTrackFromProject(projectUuid: string, trackUuid: string): Observable<IProjectResult> {
    return this.removeTracksFromProject(projectUuid, [trackUuid]);
  }

  /** Bulk add; the tracks are saved to Saved tracks as well. */
  addTracksToProject(projectUuid: string, trackUuids: string[]): Observable<IProjectResult> {
    return this.http.post<IProjectResult>(`${this.base}/projects/${projectUuid}/add-tracks/`, { track_uuids: trackUuids }, { context: this.quiet() }).pipe(
      tap(project => { this.replaceProject(project); this.loadFavorites(); }),
    );
  }

  /** Bulk remove from one project; the tracks stay in Saved tracks. */
  removeTracksFromProject(projectUuid: string, trackUuids: string[]): Observable<IProjectResult> {
    return this.http.post<IProjectResult>(`${this.base}/projects/${projectUuid}/remove-tracks/`, { track_uuids: trackUuids }, { context: this.quiet() }).pipe(
      tap(project => this.replaceProject(project)),
    );
  }

  // ─── Destinations: where each track is kept ────────────────────────

  /** Where each track is now, in the order given. Chunked so a large selection keeps URLs short. */
  getDestinations(trackUuids: string[]): Observable<ITrackDestinations[]> {
    const chunkSize = 50;
    const requests: Observable<ITrackDestinations[]>[] = [];
    for (let i = 0; i < trackUuids.length; i += chunkSize) {
      let params = new HttpParams();
      trackUuids.slice(i, i + chunkSize).forEach(uuid => { params = params.append('track_uuid', uuid); });
      requests.push(this.http.get<{ results: ITrackDestinations[] }>(`${this.base}/favorites/destinations/`, { params, context: this.quiet() }).pipe(
        map(res => res.results ?? []),
      ));
    }
    if (!requests.length) { return of([]); }
    return forkJoin(requests).pipe(map(chunks => chunks.flat()));
  }

  /**
   * add: union with what is there (single and bulk save).
   * set: exactly these destinations (edit, undo).
   * Refreshes favorites and projects so every page sees the change.
   */
  applyDestinations(mode: DestinationsMode, items: ITrackDestinations[]): Observable<ITrackDestinations[]> {
    return this.http.post<{ results: ITrackDestinations[] }>(`${this.base}/favorites/destinations/`, { mode, items }, { context: this.quiet() }).pipe(
      map(res => res.results ?? []),
      tap(() => { this.loadFavorites(); this.loadProjects(); }),
    );
  }

  /** Remove from Saved tracks; the backend also removes it from every project. */
  removeFromSaved(trackUuid: string): Observable<ITrackDestinations> {
    const previous = this.favoritesSubject.getValue();
    this.setFavorites(previous.filter(f => this.trackKey(f) !== trackUuid));
    return this.http.post<ITrackDestinations>(`${this.base}/favorites/remove/`, { track_uuid: trackUuid }, { context: this.quiet() }).pipe(
      tap(() => { this.loadFavorites(); this.loadProjects(); }),
      catchError(err => { this.setFavorites(previous); return throwError(() => err); }),
    );
  }

  isSaved(trackUuid: string | null | undefined): boolean {
    return !!trackUuid && this.favoritesSubject.getValue().some(f => this.trackKey(f) === trackUuid);
  }

  /** Projects that hold the track, by name, from the cached list. */
  projectsContaining(trackUuid: string): IProjectResult[] {
    return this.projects.filter(p => p.tracks.some(t => t.track_uuid === trackUuid));
  }

  private replaceProject(project: IProjectResult): void {
    const next = this.normalizeProject(project);
    const exists = this.projects.some(p => p.uuid === project.uuid);
    this.setProjects(exists ? this.projects.map(p => p.uuid === project.uuid ? next : p) : [next, ...this.projects]);
  }

  private setProjects(projects: IProjectResult[]): void {
    this.projectsSubject.next(projects);
  }

  /** Normalizes the nested track returned by the project-list endpoint. */
  private normalizeProject(project: IProjectResult): IProjectResult {
    return {
      ...project,
      tracks: (project.tracks ?? []).map((entry: any) => {
        const track = entry?.track ?? {};
        return {
          ...entry,
          track_uuid: entry?.track_uuid ?? track?.track_uuid ?? track?.uuid ?? '',
          isrc: entry?.isrc ?? track?.isrc ?? '',
          track_name: entry?.track_name ?? track?.track_name ?? track?.name ?? '',
          artist_name: entry?.artist_name ?? track?.artist_name ?? track?.artist_canonical ?? '',
          cover_image: entry?.cover_image ?? track?.cover_image ?? track?.image_url ?? '',
          track,
        };
      }),
    };
  }

  private quiet(): HttpContext {
    return new HttpContext().set(SKIP_ERROR_ALERT, true);
  }

  trackKey(f: any): string {
    const candidates = [f?.track_uuid, f?.uuid, f?.track_id, f?.id, f?.isrc, f?.spotify_id];
    for (const c of candidates) {
      if (c !== null && c !== undefined) {
        const s = String(c).trim();
        if (s.length && !s.startsWith('temp-')) { return s; }
      }
    }
    if (f?.track && typeof f.track === 'object') {
      const nested = this.trackKey(f.track);
      if (nested) { return nested; }
    }
    const name = (f?.track_name ?? f?.track_name_track ?? f?.name ?? '').toString().trim();
    const artist = (f?.artist_canonical ?? f?.artist ?? f?.artist_name ?? '').toString().trim();
    return `${name}::${artist}`.toLowerCase();
  }

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

  clear(): void {
    this.favoritesSubject.next([]);
    this.projectsSubject.next([]);
    this.projectsState = 'idle';
  }

  private setFavorites(favs: IFavoriteResult[]): void {
    this.favoritesSubject.next(this.mergeFavorites(favs, []));
  }
}
