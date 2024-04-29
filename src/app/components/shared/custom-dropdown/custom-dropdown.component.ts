import { NgOptimizedImage, NgClass } from '@angular/common';
import { Component, ElementRef, HostListener } from '@angular/core';
import { SearchFilterPipe } from '../../../pipes/search-filter.pipe';
import { FormsModule } from '@angular/forms';
import { HighLightDirective } from '../../../directives/high-light.directive';

@Component({
  selector: 'acrylic-custom-dropdown',
  standalone: true,
  imports: [NgClass, FormsModule, NgOptimizedImage, SearchFilterPipe, HighLightDirective],
  templateUrl: './custom-dropdown.component.html',
  styleUrl: './custom-dropdown.component.scss'
})
export class CustomDropdownComponent {
  isActive: boolean = false;
  values = [
    {title: "Track Name 1", date: 'Dec 25, 2024, 6:44 PM'},
    {title: "Track Name 2", date: 'Dec 25, 2024, 6:44 PM'},
    {title: "Track Name 3", date: 'Dec 25, 2024, 6:44 PM'},
    {title: "Track Name 4", date: 'Dec 25, 2024, 6:44 PM'},
    {title: "Track Name 5", date: 'Dec 25, 2024, 6:44 PM'},
  ];
  selectedValue: string = '';
  searchText = '';

  constructor(private elementRef: ElementRef) { }
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.isActive && !this.elementRef.nativeElement.contains(event.target)) {
      this.isActive = false;
    }
  }
  updateName(val: string) {
    this.selectedValue = val;
  }

  handleItemClick(event: MouseEvent) {
    event.stopPropagation();
  }

}
