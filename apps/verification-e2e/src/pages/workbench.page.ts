import { expect, type Locator, type Page } from '@playwright/test';

export class WorkbenchPage {
  readonly analyzeButton: Locator;
  readonly logoutButton: Locator;
  readonly resetButton: Locator;
  readonly addUrlButton: Locator;
  readonly resultsList: Locator;
  readonly historyList: Locator;
  private readonly validationAlert: Locator;
  private readonly resultPanels: Locator;

  constructor(private readonly page: Page) {
    this.analyzeButton = page.getByRole('button', { name: 'Analyze items' });
    this.logoutButton = page.getByRole('button', { name: 'Log out' });
    this.resetButton = page.getByRole('button', { name: 'Reset history' });
    this.addUrlButton = page.getByRole('button', { name: 'Add URL' });
    this.resultsList = page.getByRole('list', { name: 'Analysis results' });
    this.historyList = page.getByRole('list', { name: 'Recent analyses' });
    this.validationAlert = page.getByRole('alert');
    this.resultPanels = page.getByLabel('Analysis result');
  }

  async expectReady(): Promise<void> {
    await expect(this.analyzeButton).toBeVisible();
  }

  itemInput(index: number): Locator {
    return this.page.getByRole('textbox', { name: `Item ${index}`, exact: true });
  }

  removeItemButton(index: number): Locator {
    return this.page.getByRole('button', { name: `Remove item ${index}` });
  }

  historyButtons(): Locator {
    return this.historyList.getByRole('button');
  }

  historyItem(index: number): Locator {
    return this.historyButtons().nth(index);
  }

  results(): Locator {
    return this.resultsList.locator(':scope > li');
  }

  resultPanel(index = 0): Locator {
    return this.resultPanels.nth(index);
  }

  verdict(label: string): Locator {
    return this.page.getByLabel(`Verdict: ${label}`);
  }

  socialPreview() {
    return this.page.frameLocator('iframe[title="Social post preview"]');
  }

  async fillItems(inputs: string[]): Promise<void> {
    for (const [index, input] of inputs.entries()) {
      await this.itemInput(index + 1).fill(input);
      if (index < inputs.length - 1) {
        await this.addUrlButton.click();
      }
    }
  }

  async submitAnalysis(): Promise<void> {
    await this.analyzeButton.click();
  }

  async expectEmptyValidation(): Promise<void> {
    await expect(this.validationAlert).toHaveText('Please enter at least one URL or claim to analyze.');
  }

  async expectResultFailure(message: string): Promise<void> {
    await expect(this.resultsList.getByRole('alert')).toContainText(message);
  }

  async resetHistory(): Promise<void> {
    await this.resetButton.click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
