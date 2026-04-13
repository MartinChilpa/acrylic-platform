import { Component } from '@angular/core';
import { UploadTrackComponent } from './components/upload-track/upload-track.component';

@Component({
  selector: 'acrylic-dashboard',
  standalone: true,
  imports: [UploadTrackComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

}
