import { Component, inject } from '@angular/core';
import { AccountService } from '../../../services/account.service';
import { ActivatedRoute } from '@angular/router';
import { IVerifyUserRequest } from '../../../interfaces/request/verify-user.request';
import { NavigationService } from '../../../services/navigation.service';

@Component({
  selector: 'acrylic-verify-user',
  standalone: true,
  imports: [],
  templateUrl: './verify-user.component.html',
  styleUrl: './verify-user.component.scss'
})

export class VerifyUserComponent {
  private _accountService = inject(AccountService);
  private _route = inject(ActivatedRoute);
  public _navigationService = inject(NavigationService);

  user!: IVerifyUserRequest;
  message = "";
  errorMessage: string = '';
  verified: boolean = false

  ngOnInit(): void {
    this._route.queryParams
      .subscribe((params) => {
        this.user = {
          user_id: params['user_id'] ?? '',
          timestamp: params['timestamp'] ?? 0,
          signature: params['signature'] ?? ''
        };
        this._accountService.verifyUser(this.user).subscribe({
          next: (response: any) => {
            if (response && response.detail == 'User verified successfully') {
              this.message = "Verification successful"
              this.verified = true
            } else {
              this.errorMessage = 'Failed to verify';
            }
          },
          error: (err) => {
            this.errorMessage = 'Failed to verify';
          }
        });
      });
  }
}
