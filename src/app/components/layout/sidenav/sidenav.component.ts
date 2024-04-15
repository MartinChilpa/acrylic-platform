import { RouterLink, RouterLinkActive } from '@angular/router';
import { sidenavItems } from '../../../utils/sidenav-item.utils';
import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'acrylic-sidenav',
  standalone: true,
  imports: [
    NgOptimizedImage,
    RouterLinkActive,
    RouterLink
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  sidenavItems = sidenavItems;
}
