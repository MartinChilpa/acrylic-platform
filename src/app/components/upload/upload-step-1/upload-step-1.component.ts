import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CustomDropdownComponent } from '../../shared/custom-dropdown/custom-dropdown.component';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'acrylic-upload-step-1',
  standalone: true,
  imports: [NgClass, CustomDropdownComponent],
  templateUrl: './upload-step-1.component.html',
  styleUrl: './upload-step-1.component.scss'
})
export class UploadStep1Component {
  @Input() form!: FormGroup;
  @Output() nextStepper = new EventEmitter();
  connectSplit = [
    { Name: 'You', percentage: '60%' },
    { Name: 'John Doe', percentage: '30%' },
    { Name: 'John Doe', percentage: '5%' },
    { Name: 'John Doe', percentage: '5%' },
  ]

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }

  dropdownSelected($event: any) {
    this.form.get('name')?.setValue($event.title);
  }
}
