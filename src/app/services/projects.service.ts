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
  private readonly favoritesStorageKey = 'acrylic_favorites_cache';

  private favoritesSubject = new BehaviorSubject<IFavoriteResult[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    this.restoreFavoritesFromStorage();
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
      this.setFavorites(this.mergeFavorites(backend, this.favoritesSubject.getValue()));
    });
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

  private restoreFavoritesFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.favoritesStorageKey);
      if (!raw) { return; }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) { return; }
      this.favoritesSubject.next(parsed as IFavoriteResult[]);
    } catch {
      // ignore invalid or inaccessible storage
    }
  }

  private saveFavoritesToStorage(favs: IFavoriteResult[]): void {
    try {
      if (!favs || !favs.length) {
        localStorage.removeItem(this.favoritesStorageKey);
      } else {
        localStorage.setItem(this.favoritesStorageKey, JSON.stringify(favs));
      }
    } catch {
      // ignore storage write errors
    }
  }

  private setFavorites(favs: IFavoriteResult[]): void {
    const merged = this.mergeFavorites(favs, []);
    this.favoritesSubject.next(merged);
    this.saveFavoritesToStorage(merged);
  }
}
