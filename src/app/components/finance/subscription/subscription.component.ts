import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../../services/account.service';

@Component({
  selector: 'acrylic-subscription',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss'
})
export class SubscriptionComponent {
  subscriptionForm!: FormGroup;
  private _fb = inject(FormBuilder);
  public _accountService = inject(AccountService);

  ngOnInit(): void {
    this.subscriptionForm = this._fb.group({
      billing_email: ['', Validators.required],
      billing_details: [''],
      country_code: [''],
      phone: [null, Validators.required],
      tax_id: ['', Validators.required],
      failed_payment_notifications: [false, Validators.required],
    });
    this.getSubscription();
  }

  getSubscription() {
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
        },
        error: () => {
          this.subscriptionForm.enable();
        }
      });
  }

  toggleSwitch() { }
}
