import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { IMyArtist } from '../interfaces/response/my-artist.response';
import { IMyArtistSynclistResult } from '../interfaces/response/my-artist-synclist.response';
import { ICreateTracks } from '../interfaces/response/create-tracks.response';
import { ISplitSheetResult } from '../interfaces/response/split-sheet.response';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';
import { IPrice } from '../interfaces/response/price.response';

@Injectable({
  providedIn: 'root'
})
export class MyArtistService {

  MY_ARTIST_API_URL = `${environment.API_URL}/${environment.VERSION}/my-artist`;
  
  private _http = inject(HttpClient);
  public myArtist: WritableSignal<IMyArtist | null> = signal(null);

  buildQueryParams(params: any): HttpParams {
    let queryParams = new HttpParams();

    // Loop through the provided parameters and add them to the HttpParams object
    Object.keys(params).forEach(key => {
      if (params[key]) {
        queryParams = queryParams.set(key, params[key]);
      }
    });

    return queryParams;
  }

  getMyArtist() {
    return this._http.get(`${this.MY_ARTIST_API_URL}/profile/`).pipe(
      switchMap((response: any) => {
        this.myArtist.set(response);

        // Return a new observable with the response
        return of(response);
      })
    )
  }

  updateMyArtist(request: IMyArtist): Observable<IMyArtist> {
    return this._http.put<IMyArtist>(`${this.MY_ARTIST_API_URL}/profile/`, request)
  }

  getMyArtistSynclist(): Observable<ICommonSuccessResponse<IMyArtistSynclistResult[]>> {
    return this._http.get<ICommonSuccessResponse<IMyArtistSynclistResult[]>>(`${this.MY_ARTIST_API_URL}/synclists/`);
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

  getTracks(): Observable<ICommonSuccessResponse<ICreateTracks[]>> {
    return this._http.get<ICommonSuccessResponse<ICreateTracks[]>>(`${this.MY_ARTIST_API_URL}/tracks/`);
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
    return this._http.post<Object>(`${this.MY_ARTIST_API_URL}/synclists/${synclistId}/add-tracks/`, {
      tracks: [
        {
          track_uuid: trackId
        }
      ]
    });
  }

  removeSynclistTrack(synclistId: string, trackId: string): Observable<Object> {
    return this._http.post<Object>(`${this.MY_ARTIST_API_URL}/synclists/${synclistId}/remove-tracks/`, {
      tracks: [
        {
          track_uuid: trackId
        }
      ]
    });
  }

  getSplitSheet(queryParams: any = {}): Observable<ICommonSuccessResponse<ISplitSheetResult[]>> {
    let params = this.buildQueryParams(queryParams)
    return this._http.get<ICommonSuccessResponse<ISplitSheetResult[]>>(`${this.MY_ARTIST_API_URL}/split-sheets/`, { params });
  }

  getSplitSheetById(id: string): Observable<ISplitSheetResult> {
    return this._http.get<ISplitSheetResult>(`${this.MY_ARTIST_API_URL}/split-sheets/${id}/`);
  }

  createSplitSheet(request: any): Observable<any> {
    return this._http.post<any>(`${this.MY_ARTIST_API_URL}/split-sheets/`, request);
  }

  requestSignature(uuid: string, request: any): Observable<any> {
    return this._http.post<any>(`${this.MY_ARTIST_API_URL}/split-sheets/${uuid}/request-signatures/`, request);
  }

  updateSplitSheet(request: any, uuid: string): Observable<any> {
    return this._http.put<any>(`${this.MY_ARTIST_API_URL}/split-sheets/${uuid}/`, request);
  }

  searchTracks(queryParams: any = {}): Observable<ICommonSuccessResponse<ICreateTracks[]>> {
    let params = this.buildQueryParams(queryParams)
    return this._http.get<ICommonSuccessResponse<ICreateTracks[]>>(`${this.MY_ARTIST_API_URL}/tracks/`, { params });
  }

  getPrices(): Observable<ICommonSuccessResponse<IPrice[]>> {
    return this._http.get<ICommonSuccessResponse<IPrice[]>>(`${this.MY_ARTIST_API_URL}/prices/`);
  }
}
