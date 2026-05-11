import { test, expect } from '@playwright/test';

// Starter spec. Replace with your real suite — UI tests, API tests via
// APIRequestContext, and golden-dataset evaluation should each have their own
// place in apps/verification-e2e/src. This file just verifies the harness
// boots against the SUT.

test('login page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Content Verification Workbench' })).toBeVisible();
});
