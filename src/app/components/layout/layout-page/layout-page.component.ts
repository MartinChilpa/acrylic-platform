import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'acrylic-layout-page',
  standalone: true,
  imports: [
    HeaderComponent,
    SidenavComponent,
    RouterOutlet
  ],
  templateUrl: './layout-page.component.html',
  styleUrl: './layout-page.component.scss'
})
export class LayoutPageComponent {

  // isSidebarOpen: boolean = true;
  // isScreenSmall: boolean = false;

  constructor() {
    // this.setMode(window.innerWidth);
    document.body.classList.remove('bg-primary-gradient');
    document.body.classList.add('bg-primary');
  }

  // @HostListener('window:resize', ['$event'])
  // onResize(event: any): void {
  //   this.setMode(event.target.innerWidth);
  // }

  // setMode(innerWidth: number): void {
  //   this.isScreenSmall = innerWidth < 992;
  //   this.isSidebarOpen = !this.isScreenSmall;
  // }

  // toggleSidebar(): void {
  //   this.isSidebarOpen = !this.isSidebarOpen;
  // }
}
