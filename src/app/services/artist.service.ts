import { IMyArtist } from './../interfaces/response/my-artist.response';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';
import { ICreateTracks } from '../interfaces/response/create-tracks.response';

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  ARTIST_API_URL = `${environment.API_URL}/${environment.VERSION}/artists`;

  private _http = inject(HttpClient);

  getNewArtists(): Observable<ICommonSuccessResponse<IMyArtist[]>> {
    return this._http.get<ICommonSuccessResponse<IMyArtist[]>>(`${this.ARTIST_API_URL}/?ordering=-created&page_size=5`);
  }

  getArtistProfile(slug: string): Observable<ICommonSuccessResponse<IMyArtist[]>> {
    return this._http.get<ICommonSuccessResponse<IMyArtist[]>>(`${this.ARTIST_API_URL}/?slug=${slug}`);
  }

  getArtistTracks(uuid: string | undefined): Observable<ICommonSuccessResponse<ICreateTracks[]>> {
    return this._http.get<ICommonSuccessResponse<ICreateTracks[]>>(`${this.ARTIST_API_URL}/${uuid}/tracks/`);
  }
}
