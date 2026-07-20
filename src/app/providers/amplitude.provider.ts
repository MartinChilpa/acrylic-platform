import { isPlatformServer } from '@angular/common';
import { APP_INITIALIZER } from '@angular/core';
import { inject } from '@angular/core';
import { AmplitudeService } from '../services/amplitude.service';
import { AnalyticsRouterService } from '../services/analytics-router.service';

export function provideAmplitudeProviders(platformId: object): unknown[] {
  if (isPlatformServer(platformId)) {
    return [];
  }

  return [
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        return () => {
          const amplitudeService = inject(AmplitudeService);
          const analyticsRouterService = inject(AnalyticsRouterService);

          amplitudeService.init();
          analyticsRouterService.init();
        };
      },
      deps: [AmplitudeService, AnalyticsRouterService],
      multi: true,
    },
  ];
}
