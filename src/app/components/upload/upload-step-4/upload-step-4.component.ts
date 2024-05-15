import { NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, effect, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MyArtistService } from '../../../services/my-artist.service';
import { IMyArtist } from '../../../interfaces/response/my-artist.response';
import { SpotifyService } from '../../../services/spotify.service';
import { ISpotify } from '../../../interfaces/response/spotify.response';

@Component({
  selector: 'acrylic-upload-step-4',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './upload-step-4.component.html',
  styleUrl: './upload-step-4.component.scss'
})
export class UploadStep4Component implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Output() nextStepper = new EventEmitter();

  @ViewChild("audioSnippet") audioSnippet!: ElementRef<HTMLAudioElement>

  snippet: string = ''
  coverImage: string = ''
  duration: string = ''

  trackInfo!: ISpotify

  private _spotifyService = inject(SpotifyService)
  private _myArtistService = inject(MyArtistService);
  myArtist: IMyArtist | undefined | null;

  constructor() {
    effect(() => {
      this.myArtist = this._myArtistService.myArtist();
    })
  }

  ngOnInit(): void {
    const snippet = this.form.get('snippet')?.value
    if (snippet) {
      if (typeof snippet == 'string') {
        this.snippet = snippet
      } else {
        this.snippet = URL.createObjectURL(snippet)
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
    this._spotifyService.getTrack(this.form.get('isrc')?.value).subscribe({
      next: response => {
        this.trackInfo = response
        this.formatTime(this.trackInfo.duration)
      }
    })
  }

  playSnippet() {
    if (this.audioSnippet) {
      if (this.audioSnippet.nativeElement.paused) {
        this.audioSnippet.nativeElement.play()
      } else {
        this.audioSnippet.nativeElement.pause()
      }
    }
  }

  pauseSnippet() {
    if (this.audioSnippet) {
      this.audioSnippet.nativeElement.pause()
    }
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
      // this.formatTime(audio.duration)
    };
    audio.src = this.snippet;
  }

  formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    this.duration = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  ngOnDestroy(): void {
    if (this.audioSnippet) {
      this.audioSnippet.nativeElement.remove()
    }
  }
}
