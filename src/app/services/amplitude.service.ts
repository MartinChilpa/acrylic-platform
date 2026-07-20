import { Injectable, inject } from '@angular/core';
import * as amplitude from '@amplitude/analytics-browser';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AmplitudeService {
  private initialized = false;

  init(): void {
    if (this.initialized) return;

    try {
      amplitude.init(environment.AMPLITUDE_API_KEY, {
        defaultTracking: {
          pageViews: false,
          sessions: true,
          formInteractions: false,
          fileDownloads: false,
        },
        autocapture: false,
      });
      this.initialized = true;
      if (!environment.production) {
        console.debug('[Amplitude] SDK initialized');
      }
    } catch (error) {
      console.error('[Amplitude] Failed to initialize:', error);
    }
  }

  identifyUser(uuid: string): void {
    if (!this.initialized) return;
    try {
      amplitude.setUserId(uuid);
      if (!environment.production) {
        console.debug('[Amplitude] User identified:', uuid);
      }
    } catch (error) {
      console.error('[Amplitude] Failed to identify user:', error);
    }
  }

  trackEvent(name: string, props?: Record<string, unknown>): void {
    if (!this.initialized) return;
    try {
      amplitude.track(name, props);
      if (!environment.production) {
        console.debug('[Amplitude]', name, props);
      }
    } catch (error) {
      console.error('[Amplitude] Failed to track event:', error);
    }
  }

  resetUser(): void {
    if (!this.initialized) return;
    try {
      amplitude.reset();
      if (!environment.production) {
        console.debug('[Amplitude] User reset');
      }
    } catch (error) {
      console.error('[Amplitude] Failed to reset user:', error);
    }
  }
}
