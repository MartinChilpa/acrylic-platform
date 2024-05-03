import { NgOptimizedImage } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CustomDropdownComponent } from '../../shared/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'acrylic-inquiry',
  standalone: true,
  imports: [NgOptimizedImage, CustomDropdownComponent],
  templateUrl: './inquiry.component.html',
  styleUrl: './inquiry.component.scss'
})
export class InquiryComponent {
  @Input() inquiryTitle!: string;
  @Input() inquirySelect!: any;
  @Input() inquiryTextArea!: string;
  @Input() inquiryButton!: string;
}
