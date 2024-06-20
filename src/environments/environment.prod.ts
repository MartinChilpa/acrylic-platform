export const environment = {
    production: true,
    NAME: 'production',
    APP_URL: 'https://app.acrylic.la',
    API_URL: 'https://platform.acrylic.la/api',
    VERSION: 'v1',
    SENTRY: {
        DSN: 'https://71ca2eac6fbcf06f25ebfcfd2d88b91c@o4507231097126912.ingest.us.sentry.io/4507231097389056',
        TARGETS: [
            /^https:\/\/[a-zA-Z0-9-]+\.herokuapp\.com\//,
            /^https:\/\/app\.acrylic\.la\//,
        ]
    },
    GOOGLE_CLIENT_ID: '718561277877-9aoajc2etskkmirb136ivgknuv2gjbsn.apps.googleusercontent.com'
};