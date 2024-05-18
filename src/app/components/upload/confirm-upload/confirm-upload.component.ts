import { NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IPrice } from '../../../interfaces/response/price.response';

@Component({
  selector: 'acrylic-confirm-upload',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './confirm-upload.component.html',
  styleUrl: './confirm-upload.component.scss'
})
export class ConfirmUploadComponent {
  @Input() selectedPrice!: IPrice;
  @Output() actionTaken = new EventEmitter<boolean>()

  publishTrack() {
    this.actionTaken.emit(true);
  }
}
