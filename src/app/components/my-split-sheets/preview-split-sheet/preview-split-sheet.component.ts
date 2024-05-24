import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MyArtistService } from '../../../services/my-artist.service';
import { NavigationService } from '../../../services/navigation.service';
import { SpotifyService } from '../../../services/spotify.service';
import { ISpotify } from '../../../interfaces/response/spotify.response';
import { AlertService } from '../../../services/alert.service';
import { DurationPipe } from '../../../pipes/duration.pipe';

@Component({
  selector: 'acrylic-preview-split-sheet',
  standalone: true,
  imports: [DurationPipe],
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
  duration: number = 0

  ngOnInit(): void {
    this.splitSheetId = this._activatedRoute.snapshot.params['splitSheetId'];
    if (this.splitSheetId) {
      this.reviewObject = {}
      this.getSplitSheetDetail();
    }
    if (this.reviewObject.isrc) {
      this.getTrackPreview();
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
        ...response,
        publishing_splits: response.publishing_splits,
        master_splits: response.master_splits
      }
      if (!this.reviewObject.isrc) {
        this.reviewObject.isrc = this.reviewObject.track?.isrc
      }
      this.getTrackPreview();
    })
  }

  getTrackPreview() {
    const isrc = this.reviewObject.isrc
    this._alertService.ignoreAlert.set(true);
    this._spotifyService.getTrack(isrc).subscribe({
      next: response => {
        if (response.name) {
          this.trackInfo = response
          this.duration = this.trackInfo.duration
        }
      },
      complete: () => {
        this._alertService.ignoreAlert.set(false);
      }
    })
  }
}
