import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { MyArtistService } from '../../../services/my-artist.service';
import { NavigationService } from '../../../services/navigation.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'acrylic-header',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgClass,
    RouterLink
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  public _authService = inject(AuthService);
  public _myArtistService = inject(MyArtistService)
  public _navigationService = inject(NavigationService);

  ngOnInit(): void {
    if (this._authService.IsLoggedIn() && !this._myArtistService.myArtist()) {
      this._myArtistService.getMyArtist().subscribe();
    }
  }

  signOut(): void {
    this._authService.signOut();
  }
}

// todo (later)
// isDarkTheme: boolean = true;
// toggleTheme(): void {
//   this.isDarkTheme = !this.isDarkTheme;
//   if (this.isDarkTheme) {
//     document.body.classList.remove('light-theme'); // To apply dark theme
//   } else {
//     document.body.classList.add('light-theme'); // To apply light theme
//   }
// }