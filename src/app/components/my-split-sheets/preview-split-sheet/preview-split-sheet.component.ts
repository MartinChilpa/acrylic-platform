import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MyArtistService } from '../../../services/my-artist.service';
import { NavigationService } from '../../../services/navigation.service';
import { SpotifyService } from '../../../services/spotify.service';
import { ISpotify } from '../../../interfaces/response/spotify.response';
import { AlertService } from '../../../services/alert.service';

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

  private _activatedRoute = inject(ActivatedRoute)
  private _myArtistService = inject(MyArtistService)
  private _navigationService = inject(NavigationService)
  private _spotifyService = inject(SpotifyService)
  private _alertService = inject(AlertService)

  splitSheetId: string = ''
  trackInfo!: ISpotify
  duration: string = ''

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
      this.getTrackPreview()
    })
  }

  getTrackPreview() {
    this._alertService.ignoreAlert.set(true);
    this._spotifyService.getTrack(this.reviewObject.trackData.isrc).subscribe({
      next: response => {
        this.trackInfo = response
        this.formatTime(this.trackInfo.duration);
      },
      complete: () => {
        this._alertService.ignoreAlert.set(false);
      }
    })
  }

  formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60 / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    this.duration = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
}
