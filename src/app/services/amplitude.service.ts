import { Injectable, inject } from '@angular/core';
import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { environment } from '../../environments/environment';

// Testing-phase setting: recording 100% of sessions is fine while this app
// only has internal/test users. Revisit before real user traffic (cost +
// privacy) — see plan doc for context.
const SESSION_REPLAY_SAMPLE_RATE = 1.0;

@Injectable({
  providedIn: 'root',
})
export class AmplitudeService {
  private initialized = false;

  // Initialization is triggered explicitly via APP_INITIALIZER (see
  // amplitude.provider.ts), not from this constructor. Calling init() from
  // both places risked the SDK being set up twice before the `initialized`
  // guard could take effect, which can desync the session/device ID pairing
  // used by Session Replay ("Session Unavailable: mismatching Device ID /
  // Session ID" in the Amplitude dashboard).
  init(): void {
    if (this.initialized) return;

    try {
      amplitude.add(sessionReplayPlugin({ sampleRate: SESSION_REPLAY_SAMPLE_RATE }));
      amplitude.init(environment.AMPLITUDE_API_KEY, {
        defaultTracking: {
          pageViews: true,
          sessions: true,
          formInteractions: true,
          fileDownloads: true,
        },
        autocapture: false,
      });
      this.initialized = true;
    } catch (error) {
      console.error('[Amplitude] Failed to initialize:', error);
    }
  }

  identifyUser(uuid: string): void {
    if (!this.initialized) return;
    try {
      amplitude.setUserId(uuid);
    } catch (error) {
      console.error('[Amplitude] Failed to identify user:', error);
    }
  }

  trackEvent(name: string, props?: Record<string, unknown>): void {
    if (!this.initialized) return;
    try {
      amplitude.track(name, props);
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
    } catch (error) {
      console.error('[Amplitude] Failed to set user properties:', error);
    }
  }

  resetUser(): void {
    if (!this.initialized) return;
    try {
      amplitude.reset();
    } catch (error) {
      console.error('[Amplitude] Failed to reset user:', error);
    }
  }
}
