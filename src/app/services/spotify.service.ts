import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ISpotify } from '../interfaces/response/spotify.response';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  SPOTIFY_URL = `${environment.API_URL}/${environment.VERSION}/spotify`;

  private _http = inject(HttpClient);

  getTrack(isrc: string): Observable<ISpotify> {
    return this._http.get<ISpotify>(`${this.SPOTIFY_URL}/track/preview/${isrc}/`);
  }
}
