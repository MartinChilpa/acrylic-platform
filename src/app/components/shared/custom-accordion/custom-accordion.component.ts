import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'acrylic-custom-accordion',
  standalone: true,
  imports: [NgOptimizedImage, NgClass],
  templateUrl: './custom-accordion.component.html',
  styleUrl: './custom-accordion.component.scss',
})
export class CustomAccordionComponent {
  @Input() isOpen = false;
  @Output() toggleAccordion = new EventEmitter();

  clickedAccordion() {
    this.toggleAccordion.emit();
  }
}
