import { NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, effect, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MyArtistService } from '../../../services/my-artist.service';
import { IMyArtist } from '../../../interfaces/response/my-artist.response';

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

  @ViewChild("videoSnippet") videoSnippet!: ElementRef<HTMLVideoElement>

  snippet: string = ''
  coverImage: string = ''
  duration: string = ''

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

    this.videoInit()
  }

  playSnippet() {
    if (this.videoSnippet) {
      this.videoSnippet.nativeElement.play()
    }
  }

  pauseSnippet() {
    if (this.videoSnippet) {
      this.videoSnippet.nativeElement.pause()
    }
  }

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }

  videoInit() {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      this.form.get('duration')?.setValue(parseInt(`${video.duration}`));
      this.formatTime(video.duration)
    };
    video.src = this.snippet;
  }

  formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    this.duration = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  ngOnDestroy(): void {
    if (this.videoSnippet) {
      this.videoSnippet.nativeElement.remove()
    }
  }
}
