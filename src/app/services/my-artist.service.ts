import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { IMyArtist } from '../interfaces/response/my-artist.response';
import { IMyArtistSynclist, IMyArtistSynclistResult } from '../interfaces/response/my-artist-synclist.response';
import { ICreateTracks } from '../interfaces/response/create-tracks.response';

@Injectable({
  providedIn: 'root'
})
export class MyArtistService {

  MY_ARTIST_API_URL = `${environment.API_URL}/${environment.VERSION}/my-artist`;

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

  createSynclist(request: FormData): Observable<IMyArtistSynclistResult> {
    return this._http.post<IMyArtistSynclistResult>(`${this.MY_ARTIST_API_URL}/synclists/`, request);
  }

  createTracks(request: FormData): Observable<ICreateTracks> {
    return this._http.post<ICreateTracks>(`${this.MY_ARTIST_API_URL}/tracks/`, request);
  }

  updateTracks(request: FormData, uuid: string): Observable<ICreateTracks> {
    return this._http.put<ICreateTracks>(`${this.MY_ARTIST_API_URL}/tracks/${uuid}/`, request);
  }
}
