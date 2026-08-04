import { APP_INITIALIZER, ErrorHandler } from "@angular/core";
import { Router } from "@angular/router";
import * as Sentry from '@sentry/angular-ivy';

export function provideSentryProviders(isClient: boolean): unknown[] {
    if (!isClient) {
      return [];
    }
    return [
      {
        provide: ErrorHandler,
        useValue: Sentry.createErrorHandler({
          showDialog: false,
        }),
      },
      {
        provide: Sentry.TraceService,
        deps: [Router],
      },
      {
        provide: APP_INITIALIZER,
        useFactory: () => () => {},
        deps: [Sentry.TraceService],
        multi: true,
      },
    ];
  }