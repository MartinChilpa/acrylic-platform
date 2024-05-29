export const environment = {
    production: true,
    NAME: 'production',
    APP_URL: 'https://app.acrylic.la',
    API_URL: 'https://platform.acrylic.la/api',
    VERSION: 'v1',
    SENTRY: {
        DSN: 'https://c93db1c5719cc2b3e5b7b3150ca8e636@o4507050707779584.ingest.us.sentry.io/4507050707976192',
        TARGETS: [
            /^https:\/\/[a-zA-Z0-9-]+\.herokuapp\.com\//,
            /^https:\/\/app\.acrylic\.la\//,
        ]
    },
    GOOGLE_CLIENT_ID: '718561277877-9aoajc2etskkmirb136ivgknuv2gjbsn.apps.googleusercontent.com'
};