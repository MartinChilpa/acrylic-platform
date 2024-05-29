import { NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, effect, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MyArtistService } from '../../../services/my-artist.service';
import { IMyArtist } from '../../../interfaces/response/my-artist.response';
import { SpotifyService } from '../../../services/spotify.service';
import { ISpotify } from '../../../interfaces/response/spotify.response';
import { AlertService } from '../../../services/alert.service';
import { DurationPipe } from '../../../pipes/duration.pipe';

@Component({
  selector: 'acrylic-upload-step-4',
  standalone: true,
  imports: [NgOptimizedImage, DurationPipe],
  templateUrl: './upload-step-4.component.html',
  styleUrl: './upload-step-4.component.scss'
})
export class UploadStep4Component implements OnInit {
  @Input() form!: FormGroup;
  @Output() nextStepper = new EventEmitter();

  snippet: string = '';
  coverImage: string = '';
  trackInfo!: ISpotify;

  private _spotifyService = inject(SpotifyService);
  private _myArtistService = inject(MyArtistService);
  private _alertService = inject(AlertService);

  myArtist: IMyArtist | undefined | null;

  constructor() {
    effect(() => {
      this.myArtist = this._myArtistService.myArtist();
    })
  }

  ngOnInit(): void {
    const snippet = this.form.get('snippet')?.value;
    if (snippet) {
      if (typeof snippet == 'string') {
        this.snippet = snippet;
      } else {
        this.snippet = URL.createObjectURL(snippet);
      }
    }

    const coverImage = this.form.get('cover_image')?.value
    if (coverImage) {
      if (typeof coverImage == 'string') {
        this.coverImage = coverImage
      } else {
        this.coverImage = URL.createObjectURL(coverImage)
      }
    }
    this.getTrackPreview()
    this.audioInit()
  }

  getTrackPreview() {
    this._alertService.ignoreAlert.set(true);
    this._spotifyService.getTrack(this.form.get('isrc')?.value).subscribe({
      next: response => {
        if (response.name) {
          this.form.patchValue({
            track_found: 1,
            name: response.name,
            duration: response.duration
          })
          this.trackInfo = response;
        }
      },
      error: () => {
        this.form.get('track_found')?.setValue(0);
      },
      complete: () => {
        this._alertService.ignoreAlert.set(false);
      }
    })
  }

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }

  audioInit() {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      this.form.get('duration')?.setValue(parseInt(`${audio.duration}`));
    };
    audio.src = this.snippet;
  }
}
