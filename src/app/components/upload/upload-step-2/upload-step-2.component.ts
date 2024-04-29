import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'acrylic-upload-step-2',
  standalone: true,
  imports: [],
  templateUrl: './upload-step-2.component.html',
  styleUrl: './upload-step-2.component.scss'
})
export class UploadStep2Component {
  @Output() nextStepper = new EventEmitter();

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }
}
