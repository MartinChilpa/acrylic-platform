import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService } from './auth.service';
import { normalizeLanguage } from '../transloco.config';

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

  // Pull the account's language (account_account.language) from the backend and
  // make it the source of truth, overriding any stale value in localStorage.
  syncLanguageFromBackend(): void {
    if (this.authService.IsLoggedIn()) {
      this.authService.getAccountProfile().subscribe({
        next: (profile: any) => {
          this.applyLanguage(profile?.language);
        },
        error: (err) => {
          console.error('[LanguageSyncService] Failed to fetch profile:', err.status);
        }
      });
    }
  }

  // Normalizes and applies a language (from the account profile) to both
  // localStorage and the active Transloco language.
  applyLanguage(lang: string | null | undefined): void {
    const normalized = normalizeLanguage(lang ?? null);
    if (normalized !== this.lastLang || this.transloco.getActiveLang() !== normalized) {
      localStorage.setItem('activeLanguage', normalized);
      this.lastLang = normalized;
      this.transloco.setActiveLang(normalized);
    }
  }
}
