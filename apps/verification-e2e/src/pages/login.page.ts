import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly signInButton: Locator;
  private readonly invalidCredentialsAlert: Locator;
  private readonly signInForm: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.invalidCredentialsAlert = page.getByRole('alert');
    this.signInForm = page.getByRole('form', { name: 'Sign in' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectInvalidCredentials(): Promise<void> {
    await expect(this.invalidCredentialsAlert).toHaveText('Invalid username or password.');
  }

  async expectVisible(): Promise<void> {
    await expect(this.signInForm).toBeVisible();
  }

  async expectUsernameVisible(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
  }

  async expectSignInButtonDisabled(): Promise<void> {
    await expect(this.signInButton).toBeDisabled();
  }
}
