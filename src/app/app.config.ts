import { ApplicationConfig, PLATFORM_ID, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { HttpClientModule, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { loaderInterceptor } from './interceptors/loader.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { provideSentryProviders } from './providers/sentry.provider';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    importProvidersFrom(HttpClientModule),
    provideHttpClient(
      withFetch(),
      withInterceptors([ loaderInterceptor, authInterceptor, errorInterceptor ]),
    ),
    {
      provide: 'sentryProviders',
      useFactory: provideSentryProviders,
      deps: [PLATFORM_ID],
    }
  ]
};
