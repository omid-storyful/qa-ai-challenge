import { test as base } from '@playwright/test';

import { qaTesterCredentials } from '../helpers/auth';
import { resetState } from '../helpers/state';
import { LoginPage } from '../pages/login.page';
import { WorkbenchPage } from '../pages/workbench.page';

type TestFixtures = {
  loginPage: LoginPage;
  workbenchPage: WorkbenchPage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  workbenchPage: async ({ page }, use) => {
    await use(new WorkbenchPage(page));
  },
});

export { expect } from '@playwright/test';
export { qaTesterCredentials, resetState };

export async function signInAsQaTester(loginPage: LoginPage, workbenchPage: WorkbenchPage): Promise<void> {
  await loginPage.goto();
  await loginPage.signIn(qaTesterCredentials.username, qaTesterCredentials.password);
  await workbenchPage.expectReady();
}
