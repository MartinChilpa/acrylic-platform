import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ICommonResponse, ICommonSuccessResponse } from '../interfaces/response/common.response';
import { IResetPasswordRequest } from '../interfaces/request/reset-password.request';
import { IForgotPasswordRequest } from '../interfaces/request/forgot-password.request';
import { ISubscription } from '../interfaces/response/subscription.response';
import { IDocumentResults } from '../interfaces/response/document.response';
import { IVerifyUserRequest } from '../interfaces/request/verify-user.request';
import { ISignupResponse } from '../interfaces/response/sign-up.response';

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

  verifyUser(verifyUserRequest: IVerifyUserRequest): Observable<IVerifyUserRequest> {
    return this.http.post<IVerifyUserRequest>(`${this.ACCOUNT_API_URL}/verify-user/`, verifyUserRequest);
  }

  getSubscription(): Observable<ISubscription> {
    return this.http.get<ISubscription>(`${this.ACCOUNT_API_URL}/profile`);
  }

  updaeSubscription(request: FormData): Observable<ISubscription> {
    return this.http.put<ISubscription>(`${this.ACCOUNT_API_URL}/profile/`, request);
  }

  getDocuments(): Observable<ICommonSuccessResponse<IDocumentResults[]>> {
    return this.http.get<ICommonSuccessResponse<IDocumentResults[]>>(`${this.ACCOUNT_API_URL}/documents/`);
  }

  deleteDocument(uuid: string) {
    return this.http.delete(`${this.ACCOUNT_API_URL}/documents/${uuid}`);
  }

  registration(register: ISignupResponse): Observable<ISignupResponse> {
    return this.http.post<ISignupResponse>(`${this.ACCOUNT_API_URL}/register/`, register);
  }
}
