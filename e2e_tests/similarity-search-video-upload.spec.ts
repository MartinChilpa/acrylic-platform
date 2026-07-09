import { test, expect } from '@playwright/test';

test.describe('Video Upload Similarity Search', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard — global-setup.ts has already logged in and saved storageState
    await page.goto('/brand/dashboard');
  });

  test('Test 1: Happy path — upload valid video and get similarity results', async ({ page }) => {
    // Upload a valid video file
    await page.locator('input[type="file"]').setInputFiles('e2e_tests/fixtures/Visite Manoir Ronald Mcdonnald v3.mp4');

    // Wait for the video preview to appear and verify it shows the uploaded filename
    await expect(page.locator('.video-preview-player')).toBeVisible();
    await expect(page.locator('.video-preview-wrap p')).toContainText('Visite Manoir Ronald Mcdonnald v3.mp4');

    // Verify the search button is enabled and can be clicked
    const searchButton = page.locator('[data-testid="video-search-button"]');
    await expect(searchButton).toBeEnabled();

    // Click the search button to initiate the AIMS API call
    await searchButton.click();

    // Verify loading state appears
    await expect(page.locator('.results-loading-inline')).toBeVisible();

    // Wait for loading to complete and results to appear
    // Using a generous 60-second timeout since real AIMS round-trip can take 10-30+ seconds
    // (upload to AIMS + search call + response)
    // Note: if this times out, check AIMS API status and credentials in acrylic-core/.env
    await expect(page.locator('.result-card.result-row').first()).toBeVisible({
      timeout: 60_000,
    });

    // Verify at least one result is displayed
    const resultCards = page.locator('.result-card.result-row');
    const count = await resultCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Test 2: Client-side validation — reject non-MP4 files', async ({ page }) => {
    // Upload a non-video file
    await page.locator('input[type="file"]').setInputFiles('e2e_tests/fixtures/not-a-video.txt');

    // Verify error message appears
    const errorMsg = page.locator('.similarity-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Only MP4 format is allowed');

    // Verify video preview did NOT appear (since file was rejected)
    await expect(page.locator('.video-preview-player')).not.toBeVisible();
  });
});
