import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e_tests',
  /* Run tests serially, not in parallel */
  fullyParallel: false,
  /* Don't retry on failure for now; retries can mask real issues */
  retries: 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Global setup runs once before all tests: seeds e2e test user and logs in */
  globalSetup: require.resolve('./e2e_tests/global-setup.ts'),
  /* Shared settings for all projects */
  use: {
    /* Base URL for page.goto(path) — avoids hardcoding full URLs in tests */
    baseURL: 'http://localhost:4200',
    /* Load saved localStorage/JWT from previous login for pre-authenticated tests */
    storageState: 'e2e_tests/.auth/user.json',
    /* Capture trace on failure for debugging */
    trace: 'retain-on-failure',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npx ng serve --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
