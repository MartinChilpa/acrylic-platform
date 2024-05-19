import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { IAcrylicHomeResult } from '../interfaces/response/home.response';
import { Observable } from 'rxjs';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {
  ARTICLES_API_URL = `${environment.API_URL}/${environment.VERSION}/articles`;
  private _http = inject(HttpClient);

  getAcrylicHomeList(): Observable<ICommonSuccessResponse<IAcrylicHomeResult[]>> {
    return this._http.get<ICommonSuccessResponse<IAcrylicHomeResult[]>>(`${this.ARTICLES_API_URL}`);
  }
}
