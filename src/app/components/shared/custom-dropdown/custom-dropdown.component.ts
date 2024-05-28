import { NgOptimizedImage, NgClass } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { SearchFilterPipe } from '../../../pipes/search-filter.pipe';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HighLightDirective } from '../../../directives/high-light.directive';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'acrylic-custom-dropdown',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, NgOptimizedImage, SearchFilterPipe, HighLightDirective],
  templateUrl: './custom-dropdown.component.html',
  styleUrl: './custom-dropdown.component.scss'
})
export class CustomDropdownComponent implements OnInit, OnChanges {
  @Input() inputValue: string = '';
  @Input() title: string = '';
  @Input() placeholder: string = 'Choose or search';
  @Input() values: any[] = [];
  @Input() showSearch: boolean = true;
  @Input() loading: boolean = false;
  @Input() applyLocalFilter: boolean = true;
  @Input() noDataLabel: string = "No data available";
  @Input() className: string = "";
  @Input() required: boolean = false;
  @Output() dropdownSelected = new EventEmitter();
  @Output() searchChanged = new EventEmitter<string>();

  isActive: boolean = false;
  selectedValue: string = '';
  searchForm!: FormGroup;
  private _fb = inject(FormBuilder);
  private _elementRef = inject(ElementRef);
  private debounceSubject: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    this.searchForm = this._fb.group({
      searchText: ['']
    });
    this.debounceSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.searchChanged.emit(this.searchForm.get('searchText')?.value)
    });
  }

  searchChanges() {
    this.debounceSubject.next();
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
