import { Injectable, signal } from '@angular/core';
import { Alert } from '../interfaces/common/alert';
import { AlertType } from '../enums/alert-type.enum';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  public alert = signal<Alert>({});
  public ignoreAlert = signal<boolean>(false);

  showAlert(type: AlertType, message: string, title?: string) {
    this.alert.set({
      type: type,
      title: title,
      message: message
    });
  }

  success(message: string, title?: string) {
    this.showAlert(AlertType.Success, message, title);
  }

  info(message: string, title?: string) {
    this.showAlert(AlertType.Info, message, title);
  }

  error(message: string, title?: string) {
    this.showAlert(AlertType.Error, message, title);
  }

  warning(message: string, title?: string) {
    this.showAlert(AlertType.Warning, message, title);
  }

}
