/* This file is Playwright's global setup hook, not a test. Run via: npm run e2e */
import { chromium, type FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  const apiUrl = process.env['API_URL'] ?? 'http://127.0.0.1:8000/api';
  const seedResponse = await fetch(`${apiUrl}/v1/testing/seed-e2e-user/`, { method: 'POST' });
  if (!seedResponse.ok) {
    throw new Error(`Failed to seed e2e test user: ${seedResponse.status} ${await seedResponse.text()}`);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4200/auth/sign-in', { waitUntil: 'networkidle' });

  // Wait for Angular to render the form inputs
  await page.waitForTimeout(2000);

  // Fill login form using placeholder selectors
  const emailInput = page.locator('input[placeholder="Enter email"]');
  const passwordInput = page.locator('input[placeholder="Enter Password"]');
  await emailInput.focus();
  await emailInput.fill(process.env['E2E_TEST_EMAIL'] ?? 'e2e-test@acrylic.la');
  await passwordInput.focus();
  await passwordInput.fill(process.env['E2E_TEST_PASSWORD'] ?? 'E2eTestPass123!');

  // Click the Sign In button in the form (not the one in the navbar)
  await page.locator('form').getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/brand/dashboard', { timeout: 30_000 });
  await page.context().storageState({ path: 'e2e_tests/.auth/user.json' });
  await browser.close();
}
