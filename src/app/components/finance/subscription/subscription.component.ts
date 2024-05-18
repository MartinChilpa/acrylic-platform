import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../../services/account.service';
import { COUNTRY_CODES } from '../../../utils/country-codes.utils';
import { CustomDropdownComponent } from '../../shared/custom-dropdown/custom-dropdown.component';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'acrylic-subscription',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CustomDropdownComponent
  ],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss'
})
export class SubscriptionComponent {
  private _fb = inject(FormBuilder);
  public _accountService = inject(AccountService);
  public _alertService = inject(AlertService);

  subscriptionForm!: FormGroup;
  countryCodes = COUNTRY_CODES;

  ngOnInit(): void {
    this.subscriptionForm = this._fb.group({
      billing_email: ['', Validators.required],
      billing_details: [''],
      country_code: ['+1'],
      phone: [null, Validators.required],
      tax_id: ['', Validators.required],
      failed_payment_notifications: [false, Validators.required],
    });
    this.getSubscription();
  }

  getSubscription() {
    this._alertService.ignoreAlert.set(true);
    this._accountService.getSubscription().subscribe({
      next: (response) => {
        this.subscriptionForm.patchValue({
          billing_email: response.billing_email,
          billing_details: response.billing_details,
          country_code: response.country_code,
          phone: response.phone,
          tax_id: response.tax_id,
          failed_payment_notifications: response.failed_payment_notifications
        })
      },
      complete: () => {
        this._alertService.ignoreAlert.set(false);
      }
    });
  }

  saveSubscription(): void {
    if (this.subscriptionForm.invalid)
      return;

    this.subscriptionForm.disable();
    this._accountService.updaeSubscription(this.subscriptionForm.value)
      .subscribe({
        next: () => {
          this.subscriptionForm.enable();
        },
        error: () => {
          this.subscriptionForm.enable();
        }
      });
  }

  dropdownSelected($event: any) {
    this.subscriptionForm.get('country_code')?.setValue($event.name);
  }
}
