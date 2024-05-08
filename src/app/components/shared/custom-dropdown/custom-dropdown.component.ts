import { NgOptimizedImage, NgClass } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
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
export class CustomDropdownComponent implements OnInit, OnChanges {
  @Input() inputValue: string = ''
  @Input() title: string = ''
  @Input() placeholder: string = 'Choose or search'
  @Input() values: any[] = []
  @Input() showSearch: boolean = true
  @Output() dropdownSelected = new EventEmitter();

  isActive: boolean = false;
  selectedValue: string = '';
  searchForm!: FormGroup;
  private _fb = inject(FormBuilder);
  private _elementRef = inject(ElementRef);

  ngOnInit(): void {
    this.searchForm = this._fb.group({
      searchText: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inputValue'] && changes['inputValue'].currentValue) {
      this.selectedValue = changes['inputValue'].currentValue
    }
    if ((changes['inputValue'] || changes['values']) && this.selectedValue) {
      const data = this.values?.find(x => x.uuid == this.selectedValue)
      if (data) {
        this.selectedValue = data.name
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.isActive && !this._elementRef.nativeElement.contains(event.target)) {
      this.isActive = false;
    }
  }

  updateName(val: any) {
    this.selectedValue = val.name;
    this.dropdownSelected.emit(val)
  }

  handleItemClick(event: MouseEvent) {
    event.stopPropagation();
  }

}
