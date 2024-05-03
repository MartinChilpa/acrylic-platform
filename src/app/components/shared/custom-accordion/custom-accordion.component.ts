import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'acrylic-custom-accordion',
  standalone: true,
  imports: [NgOptimizedImage, NgClass],
  templateUrl: './custom-accordion.component.html',
  styleUrl: './custom-accordion.component.scss',
})
export class CustomAccordionComponent {
  isOpen = false;

  toggleAccordion() {
    this.isOpen = !this.isOpen;
  }
}
