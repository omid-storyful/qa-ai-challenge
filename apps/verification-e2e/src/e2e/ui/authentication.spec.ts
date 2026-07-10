import { expect, qaTesterCredentials, resetState, test } from '../../fixtures/test-fixtures';

test.describe('sign-in', () => {
  test.beforeEach(async ({ loginPage, request }) => {
    await resetState(request);
    await loginPage.goto();
  });

  test.afterEach(async ({ request }) => {
    await resetState(request);
  });

  test('shows an error for a bad password andthen lets the QA tester in', async ({ loginPage, workbenchPage }) => {
    await loginPage.signIn('qa-tester', 'wrong-password');
    await expect(workbenchPage.analyzeButton).toHaveCount(0);
    await loginPage.expectInvalidCredentials();

    await loginPage.signIn(qaTesterCredentials.username, qaTesterCredentials.password);
    await expect(workbenchPage.analyzeButton).toBeVisible();
  });
});
