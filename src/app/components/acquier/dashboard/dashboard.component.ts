import { Component } from '@angular/core';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { SimilaritySearchComponent } from '../dashboard/components/similarity-search/similarity-search.component';

@Component({
  selector: 'acrylic-dashboard',
  standalone: true,
  imports: [
    NgClass,
    SimilaritySearchComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})


export class DashboardComponent {

}