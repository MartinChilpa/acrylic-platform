import { chromium, type FullConfig } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';

export default async function globalSetup(config: FullConfig) {
  const backendPath = process.env['ACRYLIC_CORE_PATH'] ?? path.resolve(__dirname, '../../acrylic-core');
  execSync(
    'python manage.py seed_e2e_user', 
    { cwd: backendPath, stdio: 'inherit' }
  );

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4200/auth/sign-in');
  await page.locator('[formcontrolname="username"]').click();
  await page.locator('[formcontrolname="username"]').fill(process.env['E2E_TEST_EMAIL'] ?? 'e2e-test@acrylic.la');
  await page.locator('[formcontrolname="password"]').click();
  await page.locator('[formcontrolname="password"]').fill(process.env['E2E_TEST_PASSWORD'] ?? 'E2eTestPass123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/brand/dashboard');
  await page.context().storageState({ path: 'e2e_tests/.auth/user.json' });
  await browser.close();
}
