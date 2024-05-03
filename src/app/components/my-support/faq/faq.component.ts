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
  faqAccordionBox = [
    { title: '', description: '', isOpen: false },
    { title: '', description: '', isOpen: false },
    { title: '', description: '', isOpen: false },
    { title: '', description: '', isOpen: false },
    { title: '', description: '', isOpen: false },
    { title: '', description: '', isOpen: false },
  ]
  inquirySelect = {
    title: '',
    label: 'Inquiry type'
  }

  toggleAccordion(index: number) {
    this.faqAccordionBox.forEach((accordion, i) => {
      if (i !== index) {
        accordion.isOpen = false;
      }
    });

    this.faqAccordionBox[index].isOpen = !this.faqAccordionBox[index].isOpen;
  }
}
