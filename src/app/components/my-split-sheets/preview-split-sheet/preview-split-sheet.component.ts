import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MyArtistService } from '../../../services/my-artist.service';
import { DistributorsService } from '../../../services/distributors.service';
import { IDistributorsResult } from '../../../interfaces/response/distributor.response';
import { NavigationService } from '../../../services/navigation.service';

@Component({
  selector: 'acrylic-preview-split-sheet',
  standalone: true,
  imports: [],
  templateUrl: './preview-split-sheet.component.html',
  styleUrl: './preview-split-sheet.component.scss'
})
export class PreviewSplitSheetComponent implements OnInit {
  @Input() reviewObject: any = {};
  @Output() backToSplitSheetForm = new EventEmitter();
  @Output() sendRequestToCreateSheet = new EventEmitter();

  distributors!: IDistributorsResult[];

  private _activatedRoute = inject(ActivatedRoute)
  private _myArtistService = inject(MyArtistService)
  private _distributorService = inject(DistributorsService)
  private _navigationService = inject(NavigationService)

  splitSheetId: string = ''

  ngOnInit(): void {
    this.splitSheetId = this._activatedRoute.snapshot.params['splitSheetId'];
    if (this.splitSheetId) {
      this.reviewObject = {}
      this.getSplitSheetDetail()
      this.getTrackById();
    }
    if (this.reviewObject.track) {
      this.getTrackById();
    }
    this.getDistributors()
  }

  backToSplitSheet() {
    if (this.splitSheetId) {
      this._navigationService.navigateToMySplitSheet();
    }
    else {
      this.backToSplitSheetForm.emit();
    }
  }

  sendToCreateSheet() {
    this.sendRequestToCreateSheet.emit();
  }

  getSplitSheetDetail() {
    this._myArtistService.getSplitSheetById(this.splitSheetId).subscribe(response => {
      this.reviewObject = {
        ...this.reviewObject,
        publishing_splits: response.publishing_splits,
        master_splits: response.master_splits
      }
    })
  }

  getTrackById() {
    this._myArtistService.getTrackById(this.reviewObject.track ? this.reviewObject.track : this.splitSheetId).subscribe(response => {
      this.reviewObject = {
        ...this.reviewObject,
        track: response.uuid,
        trackData: response
      }
    })
  }

  getDistributors() {
    this._distributorService.getDistributorList().subscribe({
      next: response => {
        this.distributors = response.results
      }
    })
  }

  formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  distributorName() {
    return this.distributors?.find(x => x.uuid == this.reviewObject?.email)?.name
  }
}
