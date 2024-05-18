import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ISplitSheetResult } from '../../../interfaces/response/split-sheet.response';
import { CustomDropdownComponent } from '../custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'acrylic-pagination',
  standalone: true,
  imports: [
    CustomDropdownComponent
  ],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  currentPage: number = 1;
  @Input() totalPages: number = 10;
  @Input() tableData!: any[];
  @Output() pageChange: EventEmitter<any> = new EventEmitter<any>();
  paginationOptions: number[] = [5, 10, 15, 20]
  paginationDrpOptions: any[] = [5, 10, 15, 20].map(x => ({
    name: x,
    uuid: x
  }))
  pageSize: number = 5;
  pageNumber: number = 1;

  get totalPage(): number {
    return Math.ceil(this.totalPages / this.pageSize)
  }

   onPageChange(event: any) {
    this.pageSize = parseInt(event.uuid, 10);
    this.applyRequestParams()
  }
  
  applyRequestParams() {
    const requestParams = {
      pageSize: this.pageSize,
      pageNumber: this.pageNumber
    }

    this.pageChange.emit(requestParams);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPage) {
      this.currentPage++;
      this.pageNumber = this.currentPage;
      this.applyRequestParams()
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageNumber = this.currentPage;
      this.applyRequestParams()
    }
  }
} 
