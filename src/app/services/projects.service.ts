import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';
import { IFavoriteResult, ILicenseResult, IProjectResult } from '../interfaces/response/projects.response';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.API_URL}/${environment.VERSION}/my-club`;

  private favoritesSubject = new BehaviorSubject<IFavoriteResult[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  private licensedTracksSubject = new BehaviorSubject<any[]>([]);
  licensedTracks$ = this.licensedTracksSubject.asObservable();

  addLicensedTrack(track: any): void {
    const current = this.licensedTracksSubject.getValue();
    const isDupe = current.some(t => (t.id ?? t.uuid) === (track.id ?? track.uuid));
    if (!isDupe) {
      this.licensedTracksSubject.next([track, ...current]);
    }
  }

  loadFavorites(): void {
    this.http.get<ICommonSuccessResponse<IFavoriteResult[]>>(`${this.base}/favorites/`).pipe(
      catchError(() => of(null))
    ).subscribe((res) => {
      if (!res) return;
      const favs: IFavoriteResult[] = Array.isArray(res) ? (res as any) : ((res as any).results ?? []);
      this.favoritesSubject.next(favs);
    });
  }

  loadLicenses(): void {
    this.http.get<ICommonSuccessResponse<ILicenseResult[]>>(`${this.base}/licenses/`).pipe(
      catchError(() => of(null))
    ).subscribe((res) => {
      if (!res) return;
      const backendLicenses: ILicenseResult[] = Array.isArray(res) ? (res as any) : ((res as any).results ?? []);
      const current = this.licensedTracksSubject.getValue();
      const backendIds = new Set(backendLicenses.map(l => l.track_uuid));
      const optimisticOnly = current.filter(
        (t: any) => !backendIds.has(t.track_uuid ?? t.uuid ?? String(t.id ?? ''))
      );
      this.licensedTracksSubject.next([...backendLicenses, ...optimisticOnly]);
    });
  }

  toggleFavorite(trackId: string | number, trackSnapshot?: any): Observable<any> {
    const previous = this.favoritesSubject.getValue();
    const idStr = String(trackId);
    // Match by track_id (integer) or track_uuid (UUID string) to support both formats
    const existingIdx = previous.findIndex(
      f => String(f.track_id) === idStr || String(f.track_uuid) === idStr
    );

    if (existingIdx >= 0) {
      this.favoritesSubject.next(previous.filter((_, i) => i !== existingIdx));
    } else if (trackSnapshot) {
      const tempFav: IFavoriteResult = {
        uuid: `temp-${idStr}`,
        track_id: isNaN(Number(trackId)) ? undefined : Number(trackId),
        track_uuid: idStr,
        isrc: trackSnapshot.isrc ?? '',
        track_name: trackSnapshot.track_name ?? trackSnapshot.name ?? '',
        artist_name: trackSnapshot.artist_canonical ?? trackSnapshot.artist_name ?? '',
        cover_image: trackSnapshot.cover_image ?? trackSnapshot.image_url ?? '',
        created: new Date().toISOString(),
      };
      this.favoritesSubject.next([tempFav, ...previous]);
    }

    return this.http.post<any>(`${this.base}/favorites/toggle/`, { track_uuid: trackId }).pipe(
      tap(() => this.loadFavorites()),
      catchError((err) => {
        this.favoritesSubject.next(previous);
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

  createLicense(trackUuid: string, extendedCommercialUse = false): Observable<ILicenseResult> {
    return this.http.post<ILicenseResult>(`${this.base}/licenses/`, {
      track: trackUuid,
      extended_commercial_use: extendedCommercialUse,
    });
  }

  getLicenses(): Observable<ICommonSuccessResponse<ILicenseResult[]>> {
    return this.http.get<ICommonSuccessResponse<ILicenseResult[]>>(`${this.base}/licenses/`);
  }
}
