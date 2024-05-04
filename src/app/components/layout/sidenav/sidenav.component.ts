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
    this.sidenavItems.filter(x => x.label != item.label && x.submenu).forEach(item => {
      item.showSubMenu = false;
    })
    if (item.submenu) {
      item.showSubMenu = !item.showSubMenu;
    }
  }

  collapseMenu() {
    this.sidenavItems.forEach(item => {
      item.showSubMenu = false;
    })
  }
}
