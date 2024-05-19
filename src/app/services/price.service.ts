import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';
import { IPrice } from '../interfaces/response/price.response';

@Injectable({
  providedIn: 'root'
})
export class PriceService {
  PRICE_API_URL = `${environment.API_URL}/${environment.VERSION}/prices/`;
  private _http = inject(HttpClient);

  getPrices(): Observable<ICommonSuccessResponse<IPrice[]>> {
    return this._http.get<ICommonSuccessResponse<IPrice[]>>(`${this.PRICE_API_URL}`);
  }
}
