import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { IArtistResponse } from '../interfaces/response/artist.response';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  ARTIST_API_URL = `${environment.API_URL}/${environment.VERSION}/artists`;

  private _http = inject(HttpClient);

  getNewArtists(): Observable<IArtistResponse> {
    return this._http.get<IArtistResponse>(`${this.ARTIST_API_URL}/?ordering=created&page_size=5`);
  }
}
