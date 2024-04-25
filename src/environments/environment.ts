export const environment = {
    production: false,
    NAME: 'development',
    API_URL: 'https://platform.acrylic.la/api',
    VERSION: 'v1',
    SENTRY: {
        DSN: 'https://c93db1c5719cc2b3e5b7b3150ca8e636@o4507050707779584.ingest.us.sentry.io/4507050707976192',
        TARGETS: [
            'localhost',
            /^https:\/\/platform\.acrylic\.la\/api/,
            /^https:\/\/app\.acrylic\.la\//,
            '127.0.0.1:8080'
        ]
    }
};