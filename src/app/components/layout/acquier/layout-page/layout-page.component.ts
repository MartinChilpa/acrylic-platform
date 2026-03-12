import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { HeaderComponent } from '../../../shared/header/header.component';

@Component({
  selector: 'acrylic-layout-page',
  standalone: true,
  imports: [
    RouterOutlet,
    SidenavComponent,
    HeaderComponent
  ],
  templateUrl: './layout-page.component.html',
  styleUrl: './layout-page.component.scss'
})
export class LayoutPageComponent {

}
