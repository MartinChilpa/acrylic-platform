import { isPlatformServer } from '@angular/common';
import { APP_INITIALIZER, Provider } from '@angular/core';
import { AmplitudeService } from '../services/amplitude.service';
import { AnalyticsRouterService } from '../services/analytics-router.service';

export function provideAmplitudeProviders(isClient: boolean): Provider[] {
  console.log('[Provider] provideAmplitudeProviders called, isClient:', isClient);

  if (!isClient) {
    return [];
  }

  return [
    AmplitudeService,
    AnalyticsRouterService,
    {
      provide: APP_INITIALIZER,
      useFactory: (amplitudeService: AmplitudeService, analyticsRouterService: AnalyticsRouterService) => {
        console.log('[Provider] APP_INITIALIZER factory running');
        return () => {
          console.log('[Provider] Initializing Amplitude and Analytics');
          amplitudeService.init();
          analyticsRouterService.init();
        };
      },
      deps: [AmplitudeService, AnalyticsRouterService],
      multi: true,
    },
  ];
}
