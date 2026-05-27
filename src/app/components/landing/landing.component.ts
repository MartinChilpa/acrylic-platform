import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthUtils } from '../../utils/auth.utils';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'acrylic-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  private authService = inject(AuthService);
  private navigationService = inject(NavigationService);

  ngOnInit(): void {
    const token = this.authService.accessToken;
    if (token && !AuthUtils.isTokenExpired(token)) {
      if (this.authService.isLabelUserType()) {
        this.navigationService.navigateToLabelHome();
        return;
      }
      if (this.authService.isArtistUserType()) {
        this.navigationService.navigateToHome();
        return;
      }
      this.navigationService.navigateToAcquierDashboard();
    }
  }
}

