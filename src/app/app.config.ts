import { ApplicationConfig, PLATFORM_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { loaderInterceptor } from './interceptors/loader.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { provideSentryProviders } from './providers/sentry.provider';
import { authInterceptor } from './interceptors/auth.interceptor';
import { translocoProviders } from './transloco.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([ loaderInterceptor, authInterceptor, errorInterceptor ]),
    ),
    ...translocoProviders,
    {
      provide: 'sentryProviders',
      useFactory: provideSentryProviders,
      deps: [PLATFORM_ID],
    }
  ]
};
