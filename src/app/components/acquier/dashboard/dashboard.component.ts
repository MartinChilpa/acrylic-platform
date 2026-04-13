import { Component } from '@angular/core';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { HeaderComponent } from '../../shared/acquier/header/header.component';
import { SimilaritySearchComponent } from '../dashboard/components/similarity-search/similarity-search.component';
import { LocalMusicComponent } from '../dashboard/components/local-music/local-music.component';

@Component({
  selector: 'acrylic-dashboard',
  standalone: true,
  imports: [
    NgClass,
    HeaderComponent,
    SimilaritySearchComponent,
    LocalMusicComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})


export class DashboardComponent {
  showLocalMusic = true;

  onSimilaritySearched() {
    this.showLocalMusic = false;
  }

}
