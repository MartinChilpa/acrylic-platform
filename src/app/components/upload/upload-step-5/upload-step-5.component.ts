import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfirmUploadComponent } from '../confirm-upload/confirm-upload.component';
import { LiveUploadComponent } from '../live-upload/live-upload.component';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'acrylic-upload-step-5',
  standalone: true,
  imports: [ConfirmUploadComponent, LiveUploadComponent],
  templateUrl: './upload-step-5.component.html',
  styleUrl: './upload-step-5.component.scss'
})
export class UploadStep5Component {
  @Input() form!: FormGroup;
  @Output() nextStepper = new EventEmitter();
  @Output() uploadAction = new EventEmitter();

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }

  actionTaken($event: boolean) {
    this.uploadAction.emit($event)
  }
}
