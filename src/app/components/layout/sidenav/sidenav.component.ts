import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { sidenavItems } from '../../../utils/sidenav-item.utils';
import { Component, OnInit, inject } from '@angular/core';
import { NgClass, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'acrylic-sidenav',
  standalone: true,
  imports: [
    NgOptimizedImage,
    RouterLinkActive,
    RouterLink,
    NgClass,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent implements OnInit {
  private router = inject(Router);
  sidenavItems = sidenavItems;

  ngOnInit(): void {
    const currentUrl = this.router.url;
  
    this.sidenavItems.forEach(item => {
      if (item.routerLink && currentUrl.includes(item.routerLink)) {
        item.showSubMenu = true;
      } else {
        item.showSubMenu = false;
      }
    });
  }
  
  toggleSubMenu(item: any) {
    if (item.submenu) {
      item.showSubMenu = !item.showSubMenu;
    }
  }
}
