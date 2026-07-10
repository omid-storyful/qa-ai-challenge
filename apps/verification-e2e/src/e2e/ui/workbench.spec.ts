import { expect, resetState, signInAsQaTester, test } from '../../fixtures/test-fixtures';

test.describe('workbench', () => {
  test.beforeEach(async ({ loginPage, request, workbenchPage }) => {
    await resetState(request);
    await signInAsQaTester(loginPage, workbenchPage);
  });

  test.afterEach(async ({ request }) => {
    await resetState(request);
  });

  test('lets the user add up to three inputs, remove one, and add back up to the limit', async ({ workbenchPage }) => {
    await workbenchPage.addUrlButton.click();
    await workbenchPage.addUrlButton.click();

    await expect(workbenchPage.itemInput(1)).toBeVisible();
    await expect(workbenchPage.itemInput(2)).toBeVisible();
    await expect(workbenchPage.itemInput(3)).toBeVisible();
    await expect(workbenchPage.addUrlButton).toHaveCount(0);
    await expect(workbenchPage.itemInput(4)).toHaveCount(0);

    await workbenchPage.removeItemButton(2).click();
    await expect(workbenchPage.itemInput(3)).toHaveCount(0);
    await expect(workbenchPage.addUrlButton).toBeVisible();

    await workbenchPage.addUrlButton.click();
    await expect(workbenchPage.itemInput(3)).toBeVisible();
    await expect(workbenchPage.addUrlButton).toHaveCount(0);
    await expect(workbenchPage.itemInput(4)).toHaveCount(0);
  });

  test('blocks an empty submit and still lets the user log out', async ({ loginPage, workbenchPage }) => {
    await workbenchPage.submitAnalysis();
    await expect(workbenchPage.resultsList).toHaveCount(0);
    await workbenchPage.expectEmptyValidation();
    await workbenchPage.logout();
    await expect(workbenchPage.analyzeButton).toHaveCount(0);
    await loginPage.expectVisible();
  });

  test('handles a single-item analysis from submit through rendered result details', async ({ workbenchPage }) => {
    const input = 'According to Reuters, officials confirmed the bridge closure.';

    await workbenchPage.itemInput(1).fill(input);
    await workbenchPage.submitAnalysis();

    await expect(workbenchPage.results()).toHaveCount(1);
    await expect(workbenchPage.verdict('true')).toBeVisible();
    await expect(workbenchPage.resultPanel()).toContainText(input);
    await expect(workbenchPage.resultPanel()).toContainText('Reasoning:');
    await expect(workbenchPage.historyButtons()).toHaveCount(1);
  });

  test('returns to sign-in if a stored token becomes invalid', async ({ loginPage, page, workbenchPage }) => {
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'expired-token');
    });
    await page.reload();

    await expect(workbenchPage.analyzeButton).toHaveCount(0);
    await loginPage.expectVisible();
  });

  test('handles the full three-item flow and shows a social preview', async ({ workbenchPage }) => {
    await workbenchPage.fillItems([
      'https://social.example/reporter/post/42 Breaking update from the scene',
      'Old footage from 2018 is being shared as current.',
      'According to Reuters, officials confirmed the bridge closure.',
    ]);
    await workbenchPage.submitAnalysis();

    await expect(workbenchPage.addUrlButton).toHaveCount(0);
    await expect(workbenchPage.results()).toHaveCount(3, { timeout: 10_000 });
    await expect(workbenchPage.verdict('unverified')).toBeVisible();
    await expect(workbenchPage.verdict('false')).toBeVisible();
    await expect(workbenchPage.verdict('true')).toBeVisible();
    await expect(workbenchPage.socialPreview().getByRole('article', { name: 'Embedded social post' })).toBeVisible();
    await expect(workbenchPage.socialPreview().getByRole('link')).toHaveAttribute('href', /social\.example/);
  });

  test('shows a per-item error when analysis fails', async ({ page, workbenchPage }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'simulated upstream failure' }),
      });
    });

    await workbenchPage.itemInput(1).fill('This request should fail.');
    await workbenchPage.submitAnalysis();

    await expect(workbenchPage.results()).toHaveCount(1);
    await workbenchPage.expectResultFailure('simulated upstream failure');
  });

  test('reopens a saved result from history and clears the workspace on reset', async ({ page, workbenchPage }) => {
    const input = 'I heard from a friend that the water supply is contaminated.';

    await workbenchPage.itemInput(1).fill(input);
    await workbenchPage.submitAnalysis();
    await expect(workbenchPage.verdict('unverified')).toBeVisible();

    await expect(workbenchPage.historyButtons()).toHaveCount(1);
    await workbenchPage.historyItem(0).click();
    await expect(page.getByText(input, { exact: true })).toBeVisible();

    await workbenchPage.resetHistory();
    await expect(page.getByText('No analyses yet.')).toBeVisible();
    await expect(workbenchPage.resultsList).toHaveCount(0);
    await expect(workbenchPage.itemInput(1)).toHaveValue('');
  });
});
