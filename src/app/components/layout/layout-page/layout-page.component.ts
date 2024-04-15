import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'acrylic-layout-page',
  standalone: true,
  imports: [
    HeaderComponent,
    SidenavComponent,
    NgOptimizedImage,
    RouterOutlet
  ],
  templateUrl: './layout-page.component.html',
  styleUrl: './layout-page.component.scss'
})
export class LayoutPageComponent {
  showSidenav: boolean = true;

  constructor() {
    document.body.classList.remove('bg-primary-gradient');
    document.body.classList.add('bg-primary');
  }
}
