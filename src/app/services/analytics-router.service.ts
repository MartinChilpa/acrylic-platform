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
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Fire event for the page just left (if one exists)
        if (this.currentUrl) {
          const durationMs = Date.now() - this.enteredAt;
          this.amplitudeService.trackEvent('Page Viewed', {
            path: this.currentUrl,
            duration_ms: durationMs,
          });
        }

        // Update state for the new route
        this.currentUrl = event.urlAfterRedirects;
        this.enteredAt = Date.now();
      });
  }
}
