import { NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'acrylic-confirm-upload',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './confirm-upload.component.html',
  styleUrl: './confirm-upload.component.scss'
})
export class ConfirmUploadComponent {
  @Output() actionTaken = new EventEmitter<boolean>()

  publishTrack() {
    this.actionTaken.emit(true);
  }
}
