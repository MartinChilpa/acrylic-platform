import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';

@Injectable({
  providedIn: 'root'
})
export class PriceService {
  PRICE_API_URL = `${environment.API_URL}/${environment.VERSION}/prices/`;
  private _http = inject(HttpClient);

  getPrices(): Observable<ICommonSuccessResponse> {
    return this._http.get<ICommonSuccessResponse>(`${this.PRICE_API_URL}`);
  }
}
