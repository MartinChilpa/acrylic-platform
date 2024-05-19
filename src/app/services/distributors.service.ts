import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IDistributorsResult } from '../interfaces/response/distributor.response';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';

@Injectable({
  providedIn: 'root'
})
export class DistributorsService {

  DISTRIBUTOR_API_URL = `${environment.API_URL}/${environment.VERSION}/distributors`;

  private _http = inject(HttpClient);

  getDistributorList(): Observable<ICommonSuccessResponse<IDistributorsResult[]>> {
    return this._http.get<ICommonSuccessResponse<IDistributorsResult[]>>(`${this.DISTRIBUTOR_API_URL}/`);
  }
}
