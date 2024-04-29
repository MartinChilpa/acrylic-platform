import { Component } from '@angular/core';
import { UploadStep1Component } from './upload-step-1/upload-step-1.component';
import { UploadStep2Component } from './upload-step-2/upload-step-2.component';
import { UploadStep3Component } from './upload-step-3/upload-step-3.component';
import { UploadStep4Component } from './upload-step-4/upload-step-4.component';
import { UploadStep5Component } from './upload-step-5/upload-step-5.component';
import { NgClass, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'acrylic-upload',
  standalone: true,
  imports: [NgClass, NgOptimizedImage, UploadStep1Component, UploadStep2Component, UploadStep3Component, UploadStep4Component, UploadStep5Component],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent {
  activeStepper: number = 1;
  uploadStepperList = ['Connect split sheet', 'General Information', 'Upload assets', 'Preview & Confirm', 'Set your prices'];

  uploadStepper(index: number) {
    if(this.activeStepper < index) {
      return;
    }
    this.activeStepper = index;
  }

  stepperCount(step: number) {
    this.activeStepper = step;
  }
}
