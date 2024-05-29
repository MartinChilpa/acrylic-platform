import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, switchMap } from 'rxjs';
import { AuthUtils } from '../utils/auth.utils';
import { NavigationService } from './navigation.service';
import { ISignInResponse } from '../interfaces/response/sign-in.response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  AUTH_API_URL = `${environment.API_URL}/${environment.VERSION}/auth`;

  private _http = inject(HttpClient);
  private _navigationService = inject(NavigationService);
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

  set refreshToken(refreshToken: string) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  get refreshToken(): string {
    return localStorage.getItem('refreshToken') ?? '';
  }

  signIn(credentials: { username: string; password: string }): Observable<ISignInResponse> {
    return this._http.post<ISignInResponse>(this.AUTH_API_URL + '/token/', credentials).pipe(
      switchMap((response: ISignInResponse) => {
        this.setSignInResponse(response);
        return of(response);
      })
    );
  }

  signOut() {
    this.endSession();
    this._navigationService.navigateToSignIn();
  }

  check(): Observable<boolean> {
    // Check the access token expire date
    if (AuthUtils.isTokenExpired(this.accessToken)) {
      return this.refreshTokenSignIn();
    }

    // Check if the user is logged in
    if (this.IsLoggedIn()) {
      return of(this.IsLoggedIn());
    }

    return of(!!this.accessToken || false);
  }

  private refreshTokenSignIn(): Observable<boolean> {
    if (!this.refreshToken) {
      return this.endSession();
    }
    return this._http.post<ISignInResponse>(this.AUTH_API_URL + '/token/refresh/', { refresh: this.refreshToken }).pipe(
      switchMap((response: ISignInResponse) => {
        this.setSignInResponse(response);
        return of(true);
      }),
      catchError(() => {
        return this.endSession();
      })
    );
  }

  private setSignInResponse(response: ISignInResponse) {
    // Store the access token in the local storage
    this.accessToken = response.access;
    this.refreshToken = response.refresh;

    // Set the logged in to true
    this.IsLoggedIn.set(true);
  }

  private endSession(): Observable<boolean> {
    // Remove the access token from the local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Set the logged in to false
    this.IsLoggedIn.set(false);

    return of(false);
  }

  socialJwtPair(request: any) {
    return this._http.post(`${this.AUTH_API_URL}/social/jwt-pair/`, request)
  }
}
