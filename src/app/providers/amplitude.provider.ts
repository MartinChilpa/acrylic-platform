import { APP_INITIALIZER, Provider } from '@angular/core';
import { AmplitudeService } from '../services/amplitude.service';
import { AnalyticsRouterService } from '../services/analytics-router.service';

export function provideAmplitudeProviders(isClient: boolean): Provider[] {
  if (!isClient) {
    return [];
  }

  return [
    AmplitudeService,
    AnalyticsRouterService,
    {
      provide: APP_INITIALIZER,
      useFactory: (amplitudeService: AmplitudeService, analyticsRouterService: AnalyticsRouterService) => {
        return () => {
          amplitudeService.init();
          analyticsRouterService.init();
        };
      },
      deps: [AmplitudeService, AnalyticsRouterService],
      multi: true,
    },
  ];
}
