import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { publicSidenavItems, sidenavItems } from '../../../utils/sidenav-item.utils';
import { Component, OnInit, effect, inject } from '@angular/core';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

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
  sidenavItems: any[] = [];

  userLoggedIn: boolean = false;

  private _authService = inject(AuthService);

  constructor() {
    effect(() => {
      this.userLoggedIn = this._authService.IsLoggedIn()
      if (this.userLoggedIn) {
        this.sidenavItems = sidenavItems;
      } else {
        this.sidenavItems = publicSidenavItems;
      }
    })
  }

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
