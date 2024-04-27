import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ICommonResponse } from '../interfaces/response/common.response';
import { IResetPasswordRequest } from '../interfaces/request/reset-password.request';
import { IForgotPasswordRequest } from '../interfaces/request/forgot-password.request';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  ACCOUNT_API_URL = `${environment.API_URL}/${environment.VERSION}/account`;
  private http = inject(HttpClient);

  forgotPassword(forgotPasswordRequest: IForgotPasswordRequest): Observable<ICommonResponse> {
    return this.http.post<ICommonResponse>(this.ACCOUNT_API_URL + '/send-reset-password-link/', forgotPasswordRequest);
  }

  resetPassword(resetPasswordRequest: IResetPasswordRequest): Observable<ICommonResponse> {
    return this.http.post<ICommonResponse>(this.ACCOUNT_API_URL + '/reset-password/', resetPasswordRequest);
  }
}
