import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LanguageSyncService {
  private transloco = inject(TranslocoService);
  private authService = inject(AuthService);

  private lastLang: string | null = null;

  constructor() {
    setTimeout(() => this.initLanguageSync(), 0);
  }

  private initLanguageSync(): void {
    const storedLang = localStorage.getItem('activeLanguage');
    this.lastLang = storedLang;

    const checkLanguageChange = () => {
      const storedLang = localStorage.getItem('activeLanguage');
      const currentLang = this.transloco.getActiveLang();

      if (storedLang && storedLang !== currentLang) {
        this.lastLang = storedLang;
        this.transloco.setActiveLang(storedLang);
      }
    };

    window.addEventListener('storage', (event) => {
      if (event.key === 'activeLanguage') {
        checkLanguageChange();
      }
    });

    checkLanguageChange();
  }

  syncLanguageFromBackend(): void {
    if (this.authService.IsLoggedIn()) {
      this.authService.getAccountProfile().subscribe({
        next: (profile: any) => {
          const backendLang = profile?.language ?? 'en';
          if (backendLang !== this.lastLang) {
            localStorage.setItem('activeLanguage', backendLang);
            this.lastLang = backendLang;
            this.transloco.setActiveLang(backendLang);
          }
        },
        error: (err) => {
          console.error('[LanguageSyncService] Failed to fetch profile:', err.status);
        }
      });
    }
  }
}
