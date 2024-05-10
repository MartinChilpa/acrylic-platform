import { Component, OnInit, inject } from '@angular/core';
import { MyArtistService } from '../../services/my-artist.service';
import { ISplitSheetResult } from '../../interfaces/response/split-sheet.response';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'acrylic-my-split-sheets',
  standalone: true,
  imports: [],
  templateUrl: './my-split-sheets.component.html',
  styleUrl: './my-split-sheets.component.scss'
})
export class MySplitSheetsComponent implements OnInit {

  splitSheets!: ISplitSheetResult[]

  private _myArtistService = inject(MyArtistService)
  private _navigationService = inject(NavigationService)

  ngOnInit(): void {
    this.getSplitSheets()
  }

  getSplitSheets() {
    this._myArtistService.getSplitSheet().subscribe({
      next: response => {
        this.splitSheets = response.results
      }
    })
  }

  goToPreview(id: string) {
    this._navigationService.navigateToPreviewSplitSheet(id)
  }
}
