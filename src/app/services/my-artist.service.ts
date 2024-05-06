import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { IMyArtist } from '../interfaces/response/my-artist.response';
import { IMyArtistSynclist, IMyArtistSynclistResult } from '../interfaces/response/my-artist-synclist.response';
import { ICreateTracks } from '../interfaces/response/create-tracks.response';
import { ISplitSheet } from '../interfaces/response/split-sheet.response';

@Injectable({
  providedIn: 'root'
})
export class MyArtistService {

  MY_ARTIST_API_URL = `${environment.API_URL}/${environment.VERSION}/my-artist`;
  ARTIST_API_URL = `${environment.API_URL}/${environment.VERSION}/artists`;

  private _http = inject(HttpClient);
  public myArtist: WritableSignal<IMyArtist | null> = signal(null);

  getMyArtist() {
    return this._http.get(`${this.MY_ARTIST_API_URL}/profile/`).pipe(
      switchMap((response: any) => {

        this.myArtist.set(response);

        // Return a new observable with the response
        return of(response);
      })
    )
  }

  getMyArtistSynclist(): Observable<IMyArtistSynclist> {
    return this._http.get<IMyArtistSynclist>(`${this.MY_ARTIST_API_URL}/synclists/`);
  }

  getSynclistById(id: string): Observable<IMyArtistSynclistResult> {
    return this._http.get<IMyArtistSynclistResult>(`${this.MY_ARTIST_API_URL}/synclists/${id}`);
  }

  createSynclist(request: FormData): Observable<IMyArtistSynclistResult> {
    return this._http.post<IMyArtistSynclistResult>(`${this.MY_ARTIST_API_URL}/synclists/`, request);
  }

  updateSynclist(request: FormData, id: string): Observable<IMyArtistSynclistResult> {
    return this._http.put<IMyArtistSynclistResult>(`${this.MY_ARTIST_API_URL}/synclists/${id}/`, request);
  }

  getTracks(): Observable<ICreateTracks[]> {
    return this._http.get<ICreateTracks[]>(`${this.MY_ARTIST_API_URL}/tracks/`);
  }

  getTrackById(id: string): Observable<ICreateTracks> {
    return this._http.get<ICreateTracks>(`${this.MY_ARTIST_API_URL}/tracks/${id}`);
  }

  createTracks(request: FormData): Observable<ICreateTracks> {
    return this._http.post<ICreateTracks>(`${this.MY_ARTIST_API_URL}/tracks/`, request);
  }

  updateTracks(request: FormData, uuid: string): Observable<ICreateTracks> {
    return this._http.put<ICreateTracks>(`${this.MY_ARTIST_API_URL}/tracks/${uuid}/`, request);
  }

  addSynclistTrack(synclistId: string, trackId: string): Observable<Object> {
    return this._http.post<Object>(`${this.MY_ARTIST_API_URL}/synclists/${synclistId}/add-tracks/`, [
      {
        track_uuid: trackId
      }
    ]);
  }

  removeSynclistTrack(synclistId: string, trackId: string): Observable<Object> {
    return this._http.post<Object>(`${this.MY_ARTIST_API_URL}/synclists/${synclistId}/remove-tracks/`, [
      {
        track_uuid: trackId
      }
    ]);
  }

  createArtist(request: FormData): Observable<any> {
    return this._http.post<any>(`${this.ARTIST_API_URL}/register/`, request);
  }

  getSplitSheet(): Observable<ISplitSheet> {
    return this._http.get<ISplitSheet>(`${this.MY_ARTIST_API_URL}/split-sheets/`);
  }

  createSplitSheet(request: any): Observable<any> {
    return this._http.post<any>(`${this.MY_ARTIST_API_URL}/split-sheets/`, request);
  }

  updateSplitSheet(request: any, uuid: string): Observable<any> {
    return this._http.put<any>(`${this.MY_ARTIST_API_URL}/split-sheets/${uuid}/`, request);
  }
}
