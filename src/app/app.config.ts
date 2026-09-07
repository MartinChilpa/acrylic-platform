import { ApplicationConfig, PLATFORM_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { loaderInterceptor } from './interceptors/loader.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { provideSentryProviders } from './providers/sentry.provider';
import { provideAmplitudeProviders } from './providers/amplitude.provider';
import { authInterceptor } from './interceptors/auth.interceptor';
import { languageInterceptor } from './interceptors/language.interceptor';
import { translocoProviders } from './transloco.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Without this the router ignores a navigation to the URL already open,
      // so clicking Home while on the dashboard did nothing at all.
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([ loaderInterceptor, languageInterceptor, authInterceptor, errorInterceptor ]),
    ),
    provideSentryProviders(true),
    provideAmplitudeProviders(true),
    ...translocoProviders,
  ]
};
