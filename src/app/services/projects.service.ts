import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';
import { DestinationsMode, IFavoriteResult, IProjectResult, ITrackDestinations } from '../interfaces/response/projects.response';
import { SKIP_ERROR_ALERT } from '../interceptors/error.interceptor';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.API_URL}/${environment.VERSION}/my-club`;
  private readonly keepOnError = !environment.production;
  private readonly favoriteSnapshotsStoragePrefix = 'acrylic.favoriteTrackSnapshots';
  private readonly favoriteSnapshotsScopeKey = 'acrylic.favoriteTrackSnapshots.scope';
  private snapshotScope = this.readStoredSnapshotScope();

  private favoritesSubject = new BehaviorSubject<IFavoriteResult[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  /**
   * Select the account-owned snapshot cache after /account/profile/ resolves.
   * A scoped key lets snapshots survive logout without leaking them into the
   * next account that signs in on the same browser.
   */
  setSnapshotScope(scope: string | null | undefined): void {
    const normalized = (scope ?? '').toString().trim();
    if (!normalized || normalized === this.snapshotScope) { return; }

    const previousScope = this.snapshotScope;
    const previousKey = this.favoriteSnapshotsStorageKey;
    this.snapshotScope = normalized;

    if (previousScope && previousScope !== normalized) {
      this.favoritesSubject.next([]);
    }

    try {
      localStorage.setItem(this.favoriteSnapshotsScopeKey, normalized);

      // One-time migration from the unscoped cache created by the previous
      // release. Never copy data when moving between two known accounts.
      if (!previousScope) {
        const legacy = localStorage.getItem(previousKey);
        if (legacy && !localStorage.getItem(this.favoriteSnapshotsStorageKey)) {
          localStorage.setItem(this.favoriteSnapshotsStorageKey, legacy);
        }
        localStorage.removeItem(previousKey);
      }
    } catch {
      // Storage may be unavailable; in-memory favorites continue to work.
    }

    // The profile request can finish after /favorites/. Rehydrate rows that
    // are already loaded once the correct account cache becomes available.
    const current = this.favoritesSubject.getValue();
    if (current.length) {
      this.setFavorites(this.adoptTrackSnapshots(current));
    }
  }


  loadFavorites(): void {
    this.http.get<ICommonSuccessResponse<IFavoriteResult[]>>(`${this.base}/favorites/`).pipe(
      catchError((err) => {
        console.warn('[ProjectsService] loadFavorites unavailable', err);
        return of(null);
      })
    ).subscribe((res) => {
      if (!res) { return; }
      const backend: IFavoriteResult[] = Array.isArray(res) ? (res as any) : ((res as any).results ?? []);
      this.setFavorites(this.adoptTrackSnapshots(backend));
    });
  }

  toggleFavorite(trackId: string | number, trackSnapshot?: any): Observable<any> {
    const previous = this.favoritesSubject.getValue();
    const key = (trackSnapshot ? this.trackKey(trackSnapshot) : '') || String(trackId);
    const existingIdx = previous.findIndex(f => this.trackKey(f) === key);
    const previousSnapshot = this.readTrackSnapshots().get(key);

    if (existingIdx >= 0) {
      this.setFavorites(previous.filter((_, i) => i !== existingIdx));
      this.forgetTrackSnapshot(key);
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
      if (trackSnapshot && typeof trackSnapshot === 'object') {
        this.rememberTrackSnapshot(key, trackSnapshot);
      }
    }

    return this.http.post<any>(`${this.base}/favorites/toggle/`, { track_uuid: key }).pipe(
      tap(() => this.loadFavorites()),
      catchError((err) => {
        if (this.keepOnError) {
          console.warn('[ProjectsService] toggleFavorite backend unavailable (local)', err);
          return of(null);
        }
        this.setFavorites(previous);
        if (previousSnapshot) {
          this.rememberTrackSnapshot(key, previousSnapshot);
        } else {
          this.forgetTrackSnapshot(key);
        }
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
    if (trackSnapshot && typeof trackSnapshot === 'object') {
      this.rememberTrackSnapshot(trackUuid, trackSnapshot);
    }

    return this.http.post<ITrackDestinations>(`${this.base}/favorites/add/`, { track_uuid: trackUuid }, { context: this.quiet() }).pipe(
      tap(() => this.loadFavorites()),
      catchError(err => {
        this.setFavorites(previous);
        this.forgetTrackSnapshot(trackUuid);
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
        this.setProjects(list.map(p => ({ ...p, tracks: p.tracks ?? [] })));
      },
      error: () => { this.projectsState = 'error'; this.setProjects([...this.projects]); },
    });
  }

  createProject(name: string, description?: string): Observable<IProjectResult> {
    return this.http.post<IProjectResult>(`${this.base}/projects/`, { name, description: description ?? '' }, { context: this.quiet() }).pipe(
      tap(project => this.setProjects([{ ...project, tracks: project.tracks ?? [] }, ...this.projects])),
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

  addTrackToProject(projectUuid: string, trackUuid: string): Observable<IProjectResult> {
    return this.addTracksToProject(projectUuid, [trackUuid]);
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
  applyDestinations(mode: DestinationsMode, items: ITrackDestinations[], snapshots?: Map<string, any>): Observable<ITrackDestinations[]> {
    snapshots?.forEach((snapshot, key) => this.rememberTrackSnapshot(key, snapshot));
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
    const next = { ...project, tracks: project.tracks ?? [] };
    const exists = this.projects.some(p => p.uuid === project.uuid);
    this.setProjects(exists ? this.projects.map(p => p.uuid === project.uuid ? next : p) : [next, ...this.projects]);
  }

  private setProjects(projects: IProjectResult[]): void {
    this.projectsSubject.next(projects);
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

  /**
   * Backend rows carry `track` as a UUID string, so keep the rich search-result
   * snapshot separately and attach it only to favorites confirmed by the
   * backend. This preserves metrics such as audience size after a refresh while
   * preventing cached rows from becoming favorites by themselves.
   */
  private adoptTrackSnapshots(backend: IFavoriteResult[]): IFavoriteResult[] {
    const snapshots = this.readTrackSnapshots();
    for (const fav of this.favoritesSubject.getValue()) {
      const key = this.trackKey(fav);
      if (key && fav.track && typeof fav.track === 'object') {
        snapshots.set(key, fav.track);
      }
    }

    const backendKeys = new Set<string>();
    const hydrated = backend.map((fav) => {
      const key = this.trackKey(fav);
      if (key) { backendKeys.add(key); }
      if (fav.track && typeof fav.track === 'object') {
        if (key) { snapshots.set(key, fav.track); }
        return fav;
      }
      const snapshot = snapshots.get(key);
      return snapshot ? { ...fav, track: snapshot } : fav;
    });

    for (const key of snapshots.keys()) {
      if (!backendKeys.has(key)) { snapshots.delete(key); }
    }
    this.writeTrackSnapshots(snapshots);
    return hydrated;
  }

  private readTrackSnapshots(): Map<string, any> {
    try {
      const raw = localStorage.getItem(this.favoriteSnapshotsStorageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return new Map<string, any>();
      }
      return new Map<string, any>(Object.entries(parsed));
    } catch {
      return new Map<string, any>();
    }
  }

  private get favoriteSnapshotsStorageKey(): string {
    return this.snapshotScope
      ? `${this.favoriteSnapshotsStoragePrefix}.${encodeURIComponent(this.snapshotScope)}`
      : this.favoriteSnapshotsStoragePrefix;
  }

  private readStoredSnapshotScope(): string | null {
    try {
      return localStorage.getItem(this.favoriteSnapshotsScopeKey)?.trim() || null;
    } catch {
      return null;
    }
  }

  private writeTrackSnapshots(snapshots: Map<string, any>): void {
    try {
      if (!snapshots.size) {
        localStorage.removeItem(this.favoriteSnapshotsStorageKey);
        return;
      }
      localStorage.setItem(
        this.favoriteSnapshotsStorageKey,
        JSON.stringify(Object.fromEntries(snapshots))
      );
    } catch {
      // Storage may be unavailable or full; the in-memory favorite still works.
    }
  }

  private rememberTrackSnapshot(key: string, snapshot: any): void {
    if (!key || !snapshot || typeof snapshot !== 'object') { return; }
    const snapshots = this.readTrackSnapshots();
    snapshots.set(key, snapshot);
    this.writeTrackSnapshots(snapshots);
  }

  private forgetTrackSnapshot(key: string): void {
    if (!key) { return; }
    const snapshots = this.readTrackSnapshots();
    snapshots.delete(key);
    this.writeTrackSnapshots(snapshots);
  }

  /**
   * Drop only live session state. Account-scoped snapshots intentionally stay
   * in storage so rich track metadata can be restored after the next sign-in.
   */
  clear(): void {
    this.favoritesSubject.next([]);
    this.projectsSubject.next([]);
    this.projectsState = 'idle';
  }

  private setFavorites(favs: IFavoriteResult[]): void {
    this.favoritesSubject.next(this.mergeFavorites(favs, []));
  }
}
