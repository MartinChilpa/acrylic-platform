import { NgOptimizedImage, NgClass } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, inject } from '@angular/core';
import { SearchFilterPipe } from '../../../pipes/search-filter.pipe';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HighLightDirective } from '../../../directives/high-light.directive';

@Component({
  selector: 'acrylic-custom-dropdown',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, NgOptimizedImage, SearchFilterPipe, HighLightDirective],
  templateUrl: './custom-dropdown.component.html',
  styleUrl: './custom-dropdown.component.scss'
})
export class CustomDropdownComponent implements OnInit {

  @Output() dropdownSelected = new EventEmitter();

  isActive: boolean = false;
  values = [
    { title: "Track Name 1", date: 'Dec 25, 2024, 6:44 PM' },
    { title: "Track Name 2", date: 'Dec 25, 2024, 6:44 PM' },
    { title: "Track Name 3", date: 'Dec 25, 2024, 6:44 PM' },
    { title: "Track Name 4", date: 'Dec 25, 2024, 6:44 PM' },
    { title: "Track Name 5", date: 'Dec 25, 2024, 6:44 PM' },
  ];
  selectedValue: string = '';
  searchForm!: FormGroup;
  private _fb = inject(FormBuilder);
  private _elementRef = inject(ElementRef);

  ngOnInit(): void {
    this.searchForm = this._fb.group({
      searchText: ['']
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.isActive && !this._elementRef.nativeElement.contains(event.target)) {
      this.isActive = false;
    }
  }

  updateName(val: any) {
    this.selectedValue = val.title;
    this.dropdownSelected.emit(val)
  }

  handleItemClick(event: MouseEvent) {
    event.stopPropagation();
  }

}
