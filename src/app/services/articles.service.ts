import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { IAcrylicHome } from '../interfaces/response/home.response';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {
  ARTICLES_API_URL = `${environment.API_URL}/${environment.VERSION}/articles`;
  private _http = inject(HttpClient);

  getAcrylicHomeList(): Observable<IAcrylicHome> {
    return this._http.get<IAcrylicHome>(`${this.ARTICLES_API_URL}`);
  }
}
