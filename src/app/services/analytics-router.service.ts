import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AmplitudeService } from './amplitude.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsRouterService {
  private router = inject(Router);
  private amplitudeService = inject(AmplitudeService);
  private currentUrl: string | null = null;
  private enteredAt: number = 0;

  init(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe({
        next: (event: any) => {
          if (this.currentUrl) {
            const durationMs = Date.now() - this.enteredAt;
            this.amplitudeService.trackEvent('Page Viewed with Duration', {
              path: this.currentUrl,
              duration_ms: durationMs,
            });
          }

          this.currentUrl = event.urlAfterRedirects;
          this.enteredAt = Date.now();
        },
        error: (err) => {
          if (!environment.production) {
            console.error('[Analytics] Router subscription error:', err);
          }
        },
      });
  }
}
