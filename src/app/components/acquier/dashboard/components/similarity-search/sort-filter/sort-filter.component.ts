import { Component, EventEmitter, HostListener, Input, Output, SimpleChanges } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

export interface SortOption {
  id: string;
  label: string;
}

@Component({
  selector: 'acrylic-sort-filter',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './sort-filter.component.html',
  styleUrl: './sort-filter.component.scss'
})
export class SortFilterComponent {
  @Input() resetKey = 0;
  @Output() sortSelected = new EventEmitter<string>();

  isOpen = false;
  selectedSort: string | null = null;

  readonly sortOptions: SortOption[] = [
    { id: 'audience_size', label: 'Audience Size' },
    { id: 'sports_fit', label: 'Audience Sports Fit' },
    { id: 'virality', label: 'Track Virality' },
  ];

  get selectedSortLabel(): string | null {
    if (!this.selectedSort) return null;
    return this.sortOptions.find(opt => opt.id === this.selectedSort)?.label ?? null;
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetKey'] && !changes['resetKey'].firstChange) {
      this.selectedSort = null;
    }
  }

  selectSort(sortId: string): void {
    this.selectedSort = sortId;
    this.sortSelected.emit(sortId);
    this.isOpen = false;
  }

  clearSort(): void {
    this.selectedSort = null;
    this.sortSelected.emit('');
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.sort-filter')) return;
    this.isOpen = false;
  }
}
