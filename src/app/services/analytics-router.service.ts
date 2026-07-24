import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AmplitudeService } from './amplitude.service';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsRouterService {
  private router = inject(Router);
  private amplitudeService = inject(AmplitudeService);
  private currentUrl: string | null = null;
  private enteredAt: number = 0;

  init(): void {
    console.log('[Analytics] ★ init() called');
    console.log('[Analytics] Router:', this.router);
    console.log('[Analytics] Router.events:', this.router.events);

    const subscription = this.router.events
      .pipe(filter((event) => {
        console.log('[Analytics] Event type:', event.constructor.name);
        const isNavEnd = event instanceof NavigationEnd;
        console.log('[Analytics] Is NavigationEnd?', isNavEnd);
        return isNavEnd;
      }))
      .subscribe({
        next: (event: any) => {
          console.log('[Analytics] ✓ NavigationEnd event received:', event.urlAfterRedirects);

          if (this.currentUrl) {
            const durationMs = Date.now() - this.enteredAt;
            console.log('[Analytics] Tracking page view - path:', this.currentUrl, 'duration:', durationMs);
            this.amplitudeService.trackEvent('Page Viewed with Duration', {
              path: this.currentUrl,
              duration_ms: durationMs,
            });
          } else {
            console.log('[Analytics] First navigation, no previous page to track');
          }

          // Update state for the new route
          this.currentUrl = event.urlAfterRedirects;
          this.enteredAt = Date.now();
          console.log('[Analytics] Updated state - currentUrl:', this.currentUrl);
        },
        error: (err) => {
          console.error('[Analytics] ✗ Router subscription error:', err);
        },
        complete: () => {
          console.log('[Analytics] Router subscription completed');
        }
      });

    console.log('[Analytics] Router subscription created:', subscription);
  }
}
