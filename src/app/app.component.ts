import { environment } from './../environments/environment.prod';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './components/shared/loader/loader.component';
import { LoaderService } from './services/loader.service';
import { AlertComponent } from './components/shared/alert/alert.component';
import { AnalyticsRouterService } from './services/analytics-router.service';
import { LanguageSyncService } from './services/language-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    LoaderComponent,
    AlertComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public _loadingService = inject(LoaderService);
  private _analyticsRouterService = inject(AnalyticsRouterService);
  private _languageSync = inject(LanguageSyncService);

  constructor() {
    // For persisted sessions (page refresh), pull the account's language from
    // the backend so the UI language always follows the account.
    this._languageSync.syncLanguageFromBackend();
  }
}
