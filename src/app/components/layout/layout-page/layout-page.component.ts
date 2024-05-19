import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { RouterOutlet } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'acrylic-layout-page',
  standalone: true,
  imports: [
    HeaderComponent,
    SidenavComponent,
    RouterOutlet,
    NgOptimizedImage
  ],
  templateUrl: './layout-page.component.html',
  styleUrl: './layout-page.component.scss'
})
export class LayoutPageComponent {
  isScreenSmall: boolean = false;

  constructor() {
    // this.setMode(window.innerWidth);
    document.body.classList.remove('bg-primary-gradient');
    document.body.classList.add('bg-primary');
  }
}
