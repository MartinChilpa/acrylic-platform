import * as Sentry from "@sentry/angular-ivy";
import { environment } from "./environments/environment";

Sentry.init({
    // Data Source Name (https://PUBLIC_KEY:SECRET_KEY@HOST/PROJECT_ID)
    dsn: environment.SENTRY.DSN,

    // Sentry automatically creates an environment when it receives an event with the environment parameter set.
    environment: environment.NAME,

    release: "acrylic-app@1.0.0",

    integrations: [
        // Registers and configures the Tracing integration,
        // which automatically instruments your application to monitor its
        // performance, including custom Angular routing instrumentation
        Sentry.browserTracingIntegration(),
        
        // Registers the Replay integration,
        // which automatically captures Session Replays
        Sentry.replayIntegration(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: environment.SENTRY.TARGETS,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
});