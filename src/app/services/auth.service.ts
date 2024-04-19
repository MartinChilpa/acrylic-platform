import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { AuthUtils } from '../utils/auth.utils';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  AUTH_API_URL = `${environment.API_URL}/${environment.VERSION}/auth`;

  private _http = inject(HttpClient);
  public IsLoggedIn: WritableSignal<boolean> = signal(false);

  constructor() {
    this.IsLoggedIn.set(!!this.accessToken);
  }

  set accessToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  get accessToken(): string {
    return localStorage.getItem('accessToken') ?? '';
  }

  signIn(credentials: { username: string; password: string }): Observable<any> {

    // this.accessToken = "token";
    // this.IsLoggedIn.set(true);
    // return of(true);

    return this._http.post(this.AUTH_API_URL + '/token/', credentials).pipe(
      switchMap((response: any) => {
        // Store the access token in the local storage
        this.accessToken = response.access;

        // Set the logged in to true
        this.IsLoggedIn.set(true);

        // Return a new observable with the response
        return of(response);
      })
    );
  }

  signOut(): Observable<any> {
    // Remove the access token from the local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userInfo');

    // Set the logged in to false
    this.IsLoggedIn.set(false);

    // Return the observable
    return of(true);
  }

  check(): Observable<boolean> {
    // Check if the user is logged in
    if (this.IsLoggedIn()) {
      return of(this.IsLoggedIn());
    }

    // Check the access token expire date
    if (AuthUtils.isTokenExpired(this.accessToken)) {
      return of(false);
    }

    return of(!!this.accessToken || false);
  }
}
