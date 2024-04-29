import { NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, Input, Output, effect, inject } from '@angular/core';
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
export class UploadStep4Component {
  @Input() form!: FormGroup;
  @Output() nextStepper = new EventEmitter();

  private _myArtistService = inject(MyArtistService);
  myArtist: IMyArtist | undefined | null;

  constructor() {
    effect(() => {
      this.myArtist = this._myArtistService.myArtist();
    })
  }

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }
}
