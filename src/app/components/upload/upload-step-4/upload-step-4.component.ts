import { NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'acrylic-upload-step-4',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './upload-step-4.component.html',
  styleUrl: './upload-step-4.component.scss'
})
export class UploadStep4Component {
  @Output() nextStepper = new EventEmitter();

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }
}
