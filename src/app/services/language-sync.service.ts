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
    const currentLang = this.transloco.getActiveLang();
    console.log(`[LanguageSyncService] Initialized - stored: ${storedLang}, current: ${currentLang}`);
    this.lastLang = storedLang;

    const checkLanguageChange = () => {
      const storedLang = localStorage.getItem('activeLanguage');
      const currentLang = this.transloco.getActiveLang();

      if (storedLang && storedLang !== currentLang) {
        this.lastLang = storedLang;
        console.log(`[LanguageSyncService] Detected language change: ${currentLang} → ${storedLang}`);
        this.transloco.setActiveLang(storedLang);
        console.log(`[LanguageSyncService] Language updated to: ${this.transloco.getActiveLang()}`);
      }
    };

    window.addEventListener('storage', (event) => {
      if (event.key === 'activeLanguage') {
        console.log('[LanguageSyncService] Storage event for activeLanguage:', event.newValue);
        checkLanguageChange();
      }
    });

    checkLanguageChange();
  }

  syncLanguageFromBackend(): void {
    console.log('[LanguageSyncService] Manually syncing language from backend');
    if (this.authService.IsLoggedIn()) {
      this.authService.getAccountProfile().subscribe({
        next: (profile: any) => {
          const backendLang = profile?.language ?? 'en';
          if (backendLang !== this.lastLang) {
            console.log(`[LanguageSyncService] Backend language differs: ${this.lastLang} → ${backendLang}`);
            localStorage.setItem('activeLanguage', backendLang);
            this.lastLang = backendLang;
            this.transloco.setActiveLang(backendLang);
          }
        },
        error: (err) => {
          console.log('[LanguageSyncService] Failed to fetch profile:', err.status);
        }
      });
    }
  }
}
