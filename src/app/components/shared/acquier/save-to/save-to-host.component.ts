import { Component, inject } from '@angular/core';
import { SaveToService } from '../../../../services/save-to.service';
import { SaveToPickerComponent } from './save-to-picker/save-to-picker.component';
import { ProjectFormDialogComponent } from './project-form-dialog/project-form-dialog.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ToastHostComponent } from '../toast-host/toast-host.component';

/** Mounted once in the brand layout; renders the dialogs SaveToService opens, and the toasts. */
@Component({
  selector: 'acrylic-save-to-host',
  standalone: true,
  imports: [SaveToPickerComponent, ProjectFormDialogComponent, ConfirmDialogComponent, ToastHostComponent],
  template: `
    @if (saveTo.picker(); as request) {
      <acrylic-save-to-picker [request]="request" />
    }
    @if (saveTo.form(); as request) {
      <acrylic-project-form-dialog [request]="request" />
    }
    @if (saveTo.confirm(); as request) {
      <acrylic-confirm-dialog [request]="request" />
    }
    <acrylic-toast-host />
  `,
})
export class SaveToHostComponent {
  readonly saveTo = inject(SaveToService);
}
