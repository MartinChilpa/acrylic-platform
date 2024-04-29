import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IDistributors } from '../interfaces/response/distributor.response';

@Injectable({
  providedIn: 'root'
})
export class DistributorsService {

  DISTRIBUTOR_API_URL = `${environment.API_URL}/${environment.VERSION}/distributors`;

  private _http = inject(HttpClient);

  getDistributorList(): Observable<IDistributors> {
    return this._http.get<IDistributors>(`${this.DISTRIBUTOR_API_URL}/`);
  }
}
