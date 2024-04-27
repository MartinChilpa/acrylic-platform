import { Component, OnDestroy, effect, inject } from '@angular/core';
import { Alert } from '../../../interfaces/common/alert';
import { AlertService } from '../../../services/alert.service';
import { NgClass } from '@angular/common';
import { fadeAnimation } from '../../../utils/fadeanimation.util';

@Component({
  selector: 'acrylic-alert',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
  animations: [fadeAnimation]
})
export class AlertComponent implements OnDestroy {
  alerts: Alert[] = [];
  private _alertService = inject(AlertService);

  constructor() {
    effect(() => {
      const alert = this._alertService.alert();
      if (alert && (alert.type || alert.message)) {
        this.alerts.push(alert);
        setTimeout(() => {
          this.dismiss(this.alerts.indexOf(alert));
        }, 3000); // Dismiss after 3 seconds

      }
    })
  }

  dismiss(index: number): void {
    this.alerts.splice(index, 1);
  }

  ngOnDestroy(): void {
    this._alertService.alert.set({});
  }
}
