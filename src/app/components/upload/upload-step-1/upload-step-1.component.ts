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
  splitNames: any[] = [
    { name: "Track Name 1", text: 'Dec 25, 2024, 6:44 PM' },
    { name: "Track Name 2", text: 'Dec 25, 2024, 6:44 PM' },
    { name: "Track Name 3", text: 'Dec 25, 2024, 6:44 PM' },
    { name: "Track Name 4", text: 'Dec 25, 2024, 6:44 PM' },
    { name: "Track Name 5", text: 'Dec 25, 2024, 6:44 PM' },
  ]
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
    this.form.get('name')?.setValue($event.name);
  }
}
