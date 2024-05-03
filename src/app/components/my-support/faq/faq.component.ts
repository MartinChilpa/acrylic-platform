import { Component } from '@angular/core';
import { InquiryComponent } from '../inquiry/inquiry.component';
import { CustomAccordionComponent } from '../../shared/custom-accordion/custom-accordion.component';

@Component({
  selector: 'acrylic-faq',
  standalone: true,
  imports: [InquiryComponent, CustomAccordionComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent {
  faqAccordionBox = Array(6);
  inquirySelect = {
    title: '',
    label: 'Inquiry type'
  }
}
