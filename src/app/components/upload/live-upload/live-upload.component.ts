import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';

@Component({
  selector: 'acrylic-live-upload',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './live-upload.component.html',
  styleUrl: './live-upload.component.scss'
})
export class LiveUploadComponent {
  public _navigationService = inject(NavigationService)
}
