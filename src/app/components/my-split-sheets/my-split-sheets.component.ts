import { Component, OnInit, inject } from '@angular/core';
import { MyArtistService } from '../../services/my-artist.service';
import { ISplitSheetResult } from '../../interfaces/response/split-sheet.response';
import { NavigationService } from '../../services/navigation.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LoaderService } from '../../services/loader.service';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'acrylic-my-split-sheets',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './my-split-sheets.component.html',
  styleUrl: './my-split-sheets.component.scss'
})
export class MySplitSheetsComponent implements OnInit {

  splitSheets!: ISplitSheetResult[]
  searchForm!: FormGroup;
  private _fb = inject(FormBuilder);
  private _myArtistService = inject(MyArtistService)
  private _navigationService = inject(NavigationService)
  private _loadingService = inject(LoaderService);
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
    this._myArtistService.getSplitSheet(this.searchForm.get('searchText')?.value).subscribe({
      next: response => {
        this.splitSheets = response.results
      }
    })
  }

  searchChanges() {
    this.debounceSubject.next();
  }

  goToPreview(id: string) {
    this._navigationService.navigateToPreviewSplitSheet(id)
  }
}
