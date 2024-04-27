import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { of, switchMap } from 'rxjs';
import { IMyArtist } from '../interfaces/response/my-artist.response';

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

}
