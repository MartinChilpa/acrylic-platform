import { ICommonSuccessResponse } from './../interfaces/response/common.response';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IMyArtistSynclistResult } from '../interfaces/response/my-artist-synclist.response';

@Injectable({
  providedIn: 'root'
})
export class SynclistService {
  SYNCLIST_URL = `${environment.API_URL}/${environment.VERSION}/synclists`;
  private _http = inject(HttpClient);

  getLatestSyncs(): Observable<ICommonSuccessResponse<IMyArtistSynclistResult[]>> {
    return this._http.get<ICommonSuccessResponse<IMyArtistSynclistResult[]>>(`${this.SYNCLIST_URL}/?ordering=-created&page_size=5`);
  }
}
