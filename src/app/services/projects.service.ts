import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';
import { IFavoriteResult, IProjectResult } from '../interfaces/response/projects.response';

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

  getFavorites(): Observable<ICommonSuccessResponse<IFavoriteResult[]>> {
    return this.http.get<ICommonSuccessResponse<IFavoriteResult[]>>(`${this.base}/favorites/`);
  }

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
  }

  private setFavorites(favs: IFavoriteResult[]): void {
    this.favoritesSubject.next(this.mergeFavorites(favs, []));
  }
}
