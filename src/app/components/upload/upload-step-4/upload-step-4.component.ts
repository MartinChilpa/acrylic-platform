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

  @ViewChild("audioSnippet") audioSnippet!: ElementRef<HTMLAudioElement>

  snippet: string = ''

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

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }

  ngOnDestroy(): void {
    if (this.audioSnippet) {
      this.audioSnippet.nativeElement.remove()
    }
  }
}
