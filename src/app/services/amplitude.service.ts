import { Injectable, inject } from '@angular/core';
import * as amplitude from '@amplitude/analytics-browser';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AmplitudeService {
  private initialized = false;

  constructor() {
    this.init();
  }

  init(): void {
    if (this.initialized) return;

    try {
      amplitude.init(environment.AMPLITUDE_API_KEY, {
        defaultTracking: {
          pageViews: true,
          sessions: true,
          formInteractions: false,
          fileDownloads: false,
        },
        autocapture: false,
      });
      this.initialized = true;
      if (!environment.production) {
        console.log('[Amplitude] SDK initialized');
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
        console.log('[Amplitude] User identified:', uuid);
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
        console.log('[Amplitude]', name, props);
      }
    } catch (error) {
      console.error('[Amplitude] Failed to track event:', error);
    }
  }

  setUserProperties(properties: Record<string, unknown>): void {
    if (!this.initialized) return;
    try {
      const identifyEvent = new amplitude.Identify();
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          identifyEvent.set(key, value as string | number | boolean);
        }
      });
      amplitude.identify(identifyEvent);
      if (!environment.production) {
        console.log('[Amplitude] User properties set:', properties);
      }
    } catch (error) {
      console.error('[Amplitude] Failed to set user properties:', error);
    }
  }

  resetUser(): void {
    if (!this.initialized) return;
    try {
      amplitude.reset();
      if (!environment.production) {
        console.log('[Amplitude] User reset');
      }
    } catch (error) {
      console.error('[Amplitude] Failed to reset user:', error);
    }
  }
}
