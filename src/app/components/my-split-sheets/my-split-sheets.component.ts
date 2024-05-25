import { Component, OnInit, inject } from '@angular/core';
import { MyArtistService } from '../../services/my-artist.service';
import { ISplitSheetResult } from '../../interfaces/response/split-sheet.response';
import { NavigationService } from '../../services/navigation.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { DatePipe, NgOptimizedImage, NgClass } from '@angular/common';

@Component({
  selector: 'acrylic-my-split-sheets',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PaginationComponent,
    DatePipe,
    NgOptimizedImage,
    NgClass
  ],
  templateUrl: './my-split-sheets.component.html',
  styleUrl: './my-split-sheets.component.scss'
})
export class MySplitSheetsComponent implements OnInit {

  splitSheets!: ISplitSheetResult[]
  searchForm!: FormGroup;
  pageSize: number = 5;
  pageNumber: number = 1;
  totalCount: number = 10;
  private _fb = inject(FormBuilder);
  private _myArtistService = inject(MyArtistService)
  private _navigationService = inject(NavigationService)
  private debounceSubject: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    this.searchForm = this._fb.group({
      searchText: ['']
    });
    this.getSplitSheets()
    this.debounceSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.getSplitSheets()
    });
  }

  getSplitSheets() {
    this._myArtistService.getSplitSheet(this.prepareRequest()).subscribe({
      next: response => {
        this.splitSheets = response.results;
        this.totalCount = response.count;
      }
    })
  }

  searchChanges() {
    this.debounceSubject.next();
  }

  goToPreview(uuid: any) {
    this._navigationService.navigateToPreviewSplitSheet(uuid);
  }

  prepareRequest() {
    const request = {
      page: this.pageNumber,
      page_size: this.pageSize,
      search: this.searchForm.get('searchText')?.value,
    }
    return request;
  }

  onPageChange(request: any) {
    this.pageSize = request.pageSize;
    this.pageNumber = request.pageNumber;
    this.getSplitSheets();
  }
}
