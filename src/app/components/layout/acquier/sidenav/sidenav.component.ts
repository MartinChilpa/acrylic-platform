import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { acquierSidenavItems } from '../../../../utils/sidenav-item.utils';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'acrylic-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  private authService = inject(AuthService);
  isExpanded = signal(false);
  navItems = acquierSidenavItems;

  @HostListener('mouseenter')
  onMouseEnter() {
    this.isExpanded.set(true);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.isExpanded.set(false);
  }

  signOut(): void {
    this.authService.signOut();
  }
}
