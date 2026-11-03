import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { ISpotify, ISpotifySearchResponse } from '../interfaces/response/spotify.response';
import { Observable } from 'rxjs';
import { SKIP_ERROR_ALERT } from '../interceptors/error.interceptor';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  SPOTIFY_URL = `${environment.API_URL}/${environment.VERSION}/spotify`;

  private _http = inject(HttpClient);

  getTrack(isrc: string): Observable<ISpotify> {
    return this._http.get<ISpotify>(`${this.SPOTIFY_URL}/track/preview/${isrc}/`);
  }

  /** Track suggestions by free text. The caller shows its own message on failure. */
  searchTracks(q: string, limit = 5): Observable<ISpotifySearchResponse> {
    return this._http.get<ISpotifySearchResponse>(`${this.SPOTIFY_URL}/search/`, {
      params: new HttpParams().set('q', q).set('limit', limit),
      context: new HttpContext().set(SKIP_ERROR_ALERT, true),
    });
  }
}
